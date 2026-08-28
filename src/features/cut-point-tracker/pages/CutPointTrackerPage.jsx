import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

import { PageHeader } from '../../../app/components/PageHeader.jsx';
import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { TICKET_STATUS } from '../../../entities/ticket/index.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { createLeafletMap, readMapConfig } from '../../../infrastructure/map/index.js';
import { VirtualizedList } from '../../../shared/data-workspace/index.js';
import { AppIcon } from '../../../shared/ui/icon.jsx';
import {
  Button,
  ScrollArea,
  ToggleGroup,
  ToggleGroupItem,
} from '../../../shared/ui/primitives.jsx';
import { ResizableWorkspace } from '../../../shared/ui/ResizableWorkspace.jsx';
import {
  EmptyState,
  ErrorState,
  Skeleton,
  StatusBadge,
  TextInput,
} from '../../../shared/ui/index.jsx';
import { buildCutPointMarkers, filterCutPointMarkers } from '../lib/mapData.js';

const VIRTUALIZATION_THRESHOLD = 24;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All' },
  { value: TICKET_STATUS.RUNNING, label: 'Running' },
  { value: TICKET_STATUS.RESOLVED, label: 'Resolved' },
];

function MarkerRow({ marker, selected, onLocate }) {
  return (
    <article
      className={`relative border-b border-[var(--border-subtle)] px-3 py-2.5 transition-colors last:border-b-0 ${
        selected
          ? 'bg-[var(--accent-soft)]'
          : 'bg-[var(--surface-panel)] hover:bg-[var(--surface-muted)]'
      }`}
      data-selected={selected ? 'true' : 'false'}
    >
      <span
        className={`absolute inset-y-2.5 left-0 w-0.5 ${
          marker.status === TICKET_STATUS.RUNNING
            ? 'bg-[var(--success-solid)]'
            : 'bg-[var(--accent-cyan)]'
        }`}
        aria-hidden="true"
      />

      <div className="flex min-w-0 items-start gap-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-mono text-[10px] font-extrabold text-[var(--text-muted)]">
              {marker.externalTtNumber ?? 'No TT detected'}
            </span>
            <StatusBadge status={marker.status} />
            <span className="ml-auto font-mono text-[9px] font-semibold text-[var(--text-faint)]">
              {marker.updatedLabel}
            </span>
          </div>

          <h3 className="mt-1 line-clamp-2 text-[12.5px] font-extrabold leading-[1.15rem] tracking-[-0.01em] text-[var(--text-primary)]">
            {marker.title}
          </h3>

          <p className="mt-1.5 line-clamp-2 text-[10.5px] font-semibold leading-4 text-[var(--text-secondary)]">
            <span className="text-[var(--text-faint)]">Cut Point · </span>
            {marker.cutPoint || '—'}
          </p>

          <div className="mt-1 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-[9.5px] font-semibold text-[var(--text-muted)]">
            <span className="truncate">PIC · {marker.pic || '—'}</span>
            <span className="hidden text-[var(--border-strong)] sm:inline" aria-hidden="true">
              /
            </span>
            <span className="truncate font-mono text-[var(--accent-text)]">
              {marker.coordinateLabel}
            </span>
          </div>

          {marker.latestProgress ? (
            <p className="mt-1.5 line-clamp-2 border-l-2 border-[var(--border-default)] pl-2 text-[10px] font-medium leading-4 text-[var(--text-muted)]">
              {marker.latestProgress}
            </p>
          ) : null}
        </div>
      </div>

      <div className="mt-2 flex items-center justify-end gap-1.5">
        <Button
          type="button"
          tone="ghost"
          size="xs"
          className="min-h-10 md:min-h-8"
          aria-pressed={selected}
          onClick={() => onLocate(marker)}
        >
          <AppIcon name="map" size={13} />
          Locate
        </Button>
        <Button asChild tone="ghost" size="xs" className="min-h-10 md:min-h-8">
          <Link to={`/tickets/${marker.ticketId}`}>
            <AppIcon name="info" size={13} />
            Open Ticket
          </Link>
        </Button>
      </div>
    </article>
  );
}

function FilterControls({ search, status, onSearchChange, onStatusChange }) {
  return (
    <div className="grid gap-2.5 border-b border-[var(--border-subtle)] p-2.5">
      <TextInput
        id="cut-point-search"
        label="Search mapped Tickets"
        placeholder="TT, Title, PIC, Cut Point, update"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-[9px] font-extrabold uppercase tracking-[0.1em] text-[var(--text-faint)]">
          Ticket status
        </span>
        <ToggleGroup
          type="single"
          value={status}
          aria-label="Ticket status"
          onValueChange={(value) => {
            if (value) onStatusChange(value);
          }}
        >
          {STATUS_OPTIONS.map((option) => (
            <ToggleGroupItem key={option.value} value={option.value} aria-label={option.label}>
              {option.label}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
    </div>
  );
}

export function CutPointTrackerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { localDevelopmentMode } = useAuth();
  const mapHostRef = useRef(null);
  const mapClientRef = useRef(null);
  const visibleMarkersRef = useRef([]);
  const [tickets, setTickets] = useState([]);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [loading, setLoading] = useState(!localDevelopmentMode);
  const [queryError, setQueryError] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [tileWarning, setTileWarning] = useState(false);
  const [mapRevision, setMapRevision] = useState(0);
  const [mapReadyRevision, setMapReadyRevision] = useState(0);
  const requestedTicketId = useMemo(
    () => new URLSearchParams(location.search).get('ticket')?.trim() || null,
    [location.search],
  );

  const loadTickets = useCallback(async () => {
    if (localDevelopmentMode) {
      setTickets([]);
      setLoading(false);
      setQueryError(null);
      return;
    }

    setLoading(true);
    setQueryError(null);
    try {
      setTickets(
        await firestoreTicketRepository.listCutPointTickets({
          statuses: [TICKET_STATUS.RUNNING, TICKET_STATUS.RESOLVED],
          limit: 500,
        }),
      );
    } catch (error) {
      setQueryError(error);
    } finally {
      setLoading(false);
    }
  }, [localDevelopmentMode]);

  useEffect(() => {
    loadTickets();
  }, [loadTickets]);

  const markers = useMemo(() => buildCutPointMarkers(tickets), [tickets]);
  const visibleMarkers = useMemo(
    () => filterCutPointMarkers(markers, { search, status }),
    [markers, search, status],
  );
  const markerCounts = useMemo(
    () => ({
      running: markers.filter((marker) => marker.status === TICKET_STATUS.RUNNING).length,
      resolved: markers.filter((marker) => marker.status === TICKET_STATUS.RESOLVED).length,
    }),
    [markers],
  );
  const requestedMarkerAvailable = Boolean(
    requestedTicketId && markers.some((marker) => marker.ticketId === requestedTicketId),
  );
  const useVirtualizedMarkerList = visibleMarkers.length > VIRTUALIZATION_THRESHOLD;
  visibleMarkersRef.current = visibleMarkers;

  useEffect(() => {
    if (!mapHostRef.current) return undefined;

    let cancelled = false;
    let activeClient = null;
    setMapError(null);
    setTileWarning(false);

    createLeafletMap({
      container: mapHostRef.current,
      config: readMapConfig(),
      onOpenTicket: (ticketId) => navigate(`/tickets/${ticketId}`),
      onTileError: () => setTileWarning(true),
    })
      .then((client) => {
        if (cancelled) {
          client.destroy();
          return;
        }
        activeClient = client;
        mapClientRef.current = client;
        client.setMarkers(visibleMarkersRef.current);
        client.invalidateSize();
        setMapReadyRevision((current) => current + 1);
      })
      .catch((error) => {
        if (!cancelled) setMapError(error);
      });

    return () => {
      cancelled = true;
      activeClient?.destroy();
      if (mapClientRef.current === activeClient) mapClientRef.current = null;
    };
  }, [mapRevision, navigate]);

  useEffect(() => {
    mapClientRef.current?.setMarkers(visibleMarkers);
  }, [visibleMarkers]);

  useEffect(() => {
    if (!requestedTicketId || !requestedMarkerAvailable || loading || queryError || !mapReadyRevision) {
      return undefined;
    }
    const markerVisible = visibleMarkers.some((marker) => marker.ticketId === requestedTicketId);
    if (!markerVisible) return undefined;

    setSelectedTicketId(requestedTicketId);
    const timer = window.setTimeout(() => {
      mapClientRef.current?.focusMarker(requestedTicketId);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [
    loading,
    mapReadyRevision,
    queryError,
    requestedMarkerAvailable,
    requestedTicketId,
    visibleMarkers,
  ]);

  useEffect(() => {
    const host = mapHostRef.current;
    const ResizeObserverApi = globalThis.ResizeObserver;
    if (!host || typeof ResizeObserverApi !== 'function') return undefined;

    let animationFrame = null;
    const observer = new ResizeObserverApi(() => {
      const invalidate = () => {
        animationFrame = null;
        mapClientRef.current?.invalidateSize();
      };

      if (typeof window.requestAnimationFrame === 'function') {
        if (animationFrame !== null && typeof window.cancelAnimationFrame === 'function') {
          window.cancelAnimationFrame(animationFrame);
        }
        animationFrame = window.requestAnimationFrame(invalidate);
      } else {
        invalidate();
      }
    });

    observer.observe(host);
    return () => {
      observer.disconnect();
      if (animationFrame !== null && typeof window.cancelAnimationFrame === 'function') {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [mapRevision]);

  useEffect(() => {
    if (
      selectedTicketId &&
      !visibleMarkers.some((marker) => marker.ticketId === selectedTicketId)
    ) {
      setSelectedTicketId(null);
    }
  }, [selectedTicketId, visibleMarkers]);

  const locateMarker = (marker) => {
    setSelectedTicketId(marker.ticketId);
    navigate(`/cut-points?ticket=${encodeURIComponent(marker.ticketId)}`, { replace: true });
    mapClientRef.current?.focusMarker(marker.ticketId);
  };

  const mappedIncidentPane = (
    <section
      className="order-2 flex min-h-0 flex-col overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-panel)] shadow-[var(--shadow-xs)] xl:order-none xl:h-full"
      aria-labelledby="mapped-incidents-heading"
    >
      <header className="flex min-h-10 items-center justify-between gap-3 border-b border-[var(--border-subtle)] px-3">
        <div className="min-w-0">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.12em] text-[var(--text-faint)]">
            Mapped incidents
          </p>
          <h2
            id="mapped-incidents-heading"
            className="text-xs font-extrabold text-[var(--text-primary)]"
          >
            Incident list
          </h2>
        </div>
        <span className="font-mono text-[9px] font-bold text-[var(--text-faint)]">Max 500</span>
      </header>

      <FilterControls
        search={search}
        status={status}
        onSearchChange={setSearch}
        onStatusChange={setStatus}
      />

      {!loading && !queryError ? (
        <p
          className="border-b border-[var(--border-subtle)] px-3 py-1.5 text-[9.5px] font-semibold text-[var(--text-muted)]"
          aria-live="polite"
        >
          Showing {visibleMarkers.length} of {markers.length} mapped Tickets
        </p>
      ) : null}

      <div className="min-h-0 flex-1">
        {loading ? (
          <div
            className="grid gap-2 p-3"
            role="status"
            aria-live="polite"
            aria-label="Loading mapped Tickets"
          >
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
            <Skeleton className="h-28" />
          </div>
        ) : null}

        {!loading && queryError ? (
          <div className="p-3">
            <ErrorState
              title="Cut Point data could not be loaded"
              description={
                queryError.code === 'PERMISSION_DENIED'
                  ? 'Your account cannot read mapped operational Ticket data.'
                  : 'Check the Firebase connection and try again.'
              }
              onRetry={loadTickets}
            />
          </div>
        ) : null}

        {!loading && !queryError && visibleMarkers.length === 0 ? (
          <div className="p-3">
            <EmptyState
              title={markers.length === 0 ? 'No confirmed Cut Points yet' : 'No markers match'}
              description={
                markers.length === 0
                  ? 'Verified Ticket coordinates will appear here automatically.'
                  : 'Try another search term or status filter.'
              }
            />
          </div>
        ) : null}

        {!loading && !queryError && visibleMarkers.length > 0 ? (
          useVirtualizedMarkerList ? (
            <>
              <VirtualizedList
                items={visibleMarkers}
                getItemKey={(marker) => marker.ticketId}
                estimateSize={132}
                overscan={5}
                ariaLabel="Mapped incident virtualized list"
                className="hidden h-full min-h-80 xl:block"
                renderItem={(marker) => (
                  <MarkerRow
                    marker={marker}
                    selected={selectedTicketId === marker.ticketId}
                    onLocate={locateMarker}
                  />
                )}
              />
              <div className="xl:hidden">
                {visibleMarkers.map((marker) => (
                  <MarkerRow
                    key={marker.ticketId}
                    marker={marker}
                    selected={selectedTicketId === marker.ticketId}
                    onLocate={locateMarker}
                  />
                ))}
              </div>
            </>
          ) : (
            <ScrollArea className="h-full max-h-[34rem] xl:max-h-none">
              <div>
                {visibleMarkers.map((marker) => (
                  <MarkerRow
                    key={marker.ticketId}
                    marker={marker}
                    selected={selectedTicketId === marker.ticketId}
                    onLocate={locateMarker}
                  />
                ))}
              </div>
            </ScrollArea>
          )
        ) : null}
      </div>
    </section>
  );

  const mapPane = (
    <section className="order-1 relative min-h-[52vh] overflow-hidden rounded-[var(--radius-panel)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] shadow-[var(--shadow-xs)] xl:order-none xl:h-full xl:min-h-0">
      <div className="pointer-events-none absolute inset-x-2.5 top-2.5 z-[490] flex flex-wrap items-center justify-between gap-1.5">
        <span className="inline-flex min-h-6 items-center rounded-full border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] px-2 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--text-secondary)] backdrop-blur-lg">
          OpenStreetMap context
        </span>
        {selectedTicketId ? (
          <span className="inline-flex min-h-6 items-center rounded-full border border-[var(--border-accent)] bg-[var(--surface-panel-translucent)] px-2 text-[9px] font-extrabold uppercase tracking-[0.08em] text-[var(--accent-text)] backdrop-blur-lg">
            Marker focused
          </span>
        ) : null}
      </div>

      <div ref={mapHostRef} className="absolute inset-0" role="region" aria-label="Cut Point map" />

      {!loading && !queryError && visibleMarkers.length === 0 ? (
        <div className="pointer-events-none absolute inset-x-3 top-12 z-[500] border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] px-3 py-2 text-[10.5px] font-medium text-[var(--text-secondary)] shadow-[var(--shadow-xs)] backdrop-blur-lg">
          No eligible markers for the current filter. The basemap remains available for context.
        </div>
      ) : null}

      {tileWarning ? (
        <div className="absolute inset-x-3 top-12 z-[510] border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3 text-[var(--warning-text)] shadow-[var(--shadow-sm)]">
          <p className="text-[11px] font-extrabold">Basemap tiles are having trouble loading.</p>
          <p className="mt-1 text-[10px] leading-4">
            Ticket data and coordinates remain available in the incident list.
          </p>
          <Button
            type="button"
            tone="secondary"
            size="xs"
            className="mt-2 min-h-10 md:min-h-8"
            onClick={() => setMapRevision((current) => current + 1)}
          >
            <AppIcon name="refresh" size={13} />
            Retry map tiles
          </Button>
        </div>
      ) : null}

      {mapError ? (
        <div className="absolute inset-3 z-[520] grid place-items-center border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] p-4 text-center shadow-[var(--shadow-md)] backdrop-blur-xl">
          <div className="max-w-sm">
            <span
              className="mx-auto grid h-9 w-9 place-items-center rounded-full bg-[var(--danger-soft)] text-[var(--danger-text)]"
              aria-hidden="true"
            >
              <AppIcon name="error" size={16} />
            </span>
            <p className="mt-3 text-[12px] font-extrabold text-[var(--text-primary)]">
              Map renderer could not start
            </p>
            <p className="mt-1.5 text-[10.5px] leading-5 text-[var(--text-secondary)]">
              The Ticket list remains usable. Retry the Leaflet map without reloading Ticket data.
            </p>
            <Button
              type="button"
              tone="secondary"
              size="sm"
              className="mt-3"
              onClick={() => setMapRevision((current) => current + 1)}
            >
              <AppIcon name="refresh" size={14} />
              Retry map
            </Button>
          </div>
        </div>
      ) : null}
    </section>
  );

  return (
    <div className="grid gap-3 overflow-x-hidden">
      <PageHeader
        title="Cut Point Tracker"
        eyebrow="Geographic incident view"
        description="Verified operational coordinates from the canonical Ticket dataset."
        actions={
          <Button tone="secondary" size="sm" disabled={loading} onClick={loadTickets}>
            <AppIcon name="refresh" size={14} />
            {loading ? 'Refreshing…' : 'Refresh data'}
          </Button>
        }
      />

      <div
        className="flex min-h-8 flex-wrap items-center gap-x-3 gap-y-1 border-b border-[var(--border-subtle)] pb-2 text-[9.5px] font-semibold text-[var(--text-muted)]"
        role="group"
        aria-label="Cut Point workspace summary"
      >
        <span>
          <strong className="font-mono text-[var(--text-primary)]">{markers.length}</strong> mapped
        </span>
        <span>
          <strong className="font-mono text-[var(--success-text)]">{markerCounts.running}</strong>{' '}
          Running
        </span>
        <span>
          <strong className="font-mono text-[var(--accent-text)]">{markerCounts.resolved}</strong>{' '}
          Resolved
        </span>
        <span className="ml-auto font-mono text-[var(--text-faint)]">
          {visibleMarkers.length} visible · query cap 500
        </span>
      </div>

      {requestedTicketId && !loading && !queryError && !requestedMarkerAvailable ? (
        <div className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-control)] border border-[var(--warning-border)] bg-[var(--warning-soft)] px-3 py-2 text-[10.5px] text-[var(--warning-text)]">
          <span>
            The requested Ticket is not currently map-eligible. It may be missing a verified coordinate or no longer be Running/Resolved.
          </span>
          <Button asChild tone="ghost" size="xs">
            <Link to={`/tickets/${encodeURIComponent(requestedTicketId)}`}>Open Ticket</Link>
          </Button>
        </div>
      ) : null}

      {localDevelopmentMode ? (
        <div className="border-l-2 border-[var(--accent-solid)] bg-[var(--accent-soft)] px-3 py-2 text-[10.5px] leading-5 text-[var(--text-secondary)]">
          <span className="font-extrabold text-[var(--accent-text)]">Local preview.</span> No
          persisted Cut Point records are available until Firebase is configured; the map still uses
          the configured OpenStreetMap-compatible tile source.
        </div>
      ) : null}

      <ResizableWorkspace
        id="cut-point-map-workspace"
        primaryId="incidents"
        secondaryId="map"
        primaryDefault={35}
        primaryMin="320px"
        secondaryMin="480px"
        primary={mappedIncidentPane}
        secondary={mapPane}
        className="h-[calc(100vh-9rem)] min-h-[620px]"
        mobileClassName="min-w-0"
      />
    </div>
  );
}
