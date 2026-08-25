import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { TICKET_STATUS } from '../../../entities/ticket/index.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { createLeafletMap, readMapConfig } from '../../../infrastructure/map/index.js';
import { VirtualizedList } from '../../../shared/data-workspace/index.js';
import {
  EmptyState,
  ErrorState,
  SelectField,
  Skeleton,
  StatusBadge,
  TextInput,
  UiIcon,
} from '../../../shared/ui/index.jsx';
import { buildCutPointMarkers, filterCutPointMarkers } from '../lib/mapData.js';

const secondaryActionClass =
  'inline-flex min-h-10 select-none items-center justify-center gap-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 text-xs font-bold text-[var(--text-primary)] shadow-[var(--shadow-xs)] transition-[transform,background-color,border-color,box-shadow] duration-200 hover:-translate-y-0.5 hover:border-[var(--border-default)] hover:bg-[var(--surface-panel-strong)] hover:shadow-[var(--shadow-sm)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] active:scale-[0.975] active:translate-y-0';
const VIRTUALIZATION_THRESHOLD = 24;

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Running + Resolved' },
  { value: TICKET_STATUS.RUNNING, label: 'Running' },
  { value: TICKET_STATUS.RESOLVED, label: 'Resolved' },
];

function MarkerCard({ marker, selected, onLocate }) {
  return (
    <article
      className={`group relative overflow-hidden rounded-2xl border p-3.5 shadow-[var(--shadow-xs)] transition-[transform,background-color,border-color,box-shadow] duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[var(--shadow-sm)] ${
        selected
          ? 'border-[var(--border-accent)] bg-[var(--accent-soft)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-panel)] hover:border-[var(--border-default)]'
      }`}
    >
      <span
        className={`absolute inset-y-4 left-0 w-0.5 rounded-full ${
          marker.status === TICKET_STATUS.RUNNING
            ? 'bg-[var(--success-solid)]'
            : 'bg-[var(--accent-cyan)]'
        }`}
        aria-hidden="true"
      />
      <div className="flex flex-wrap items-start justify-between gap-2 pl-1">
        <div className="min-w-0 flex-1">
          <p className="font-mono text-[11px] font-bold text-[var(--text-muted)]">
            {marker.externalTtNumber ?? 'No TT detected'}
          </p>
          <h3 className="mt-1.5 line-clamp-2 text-sm font-bold leading-5 tracking-[-0.015em]">
            {marker.title}
          </h3>
        </div>
        <StatusBadge status={marker.status} />
      </div>
      <dl className="mt-3 grid grid-cols-2 gap-2 pl-1 text-xs">
        <div className="col-span-2 rounded-xl bg-[var(--surface-muted)] p-2.5">
          <dt className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[var(--text-muted)]">
            Cut Point
          </dt>
          <dd className="mt-1 line-clamp-2 font-semibold leading-5 text-[var(--text-secondary)]">
            {marker.cutPoint || '—'}
          </dd>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-2.5">
          <dt className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[var(--text-muted)]">
            PIC
          </dt>
          <dd className="mt-1 truncate font-semibold text-[var(--text-secondary)]">
            {marker.pic || '—'}
          </dd>
        </div>
        <div className="rounded-xl bg-[var(--surface-muted)] p-2.5">
          <dt className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[var(--text-muted)]">
            Coordinate
          </dt>
          <dd className="mt-1 truncate font-mono text-[10px] font-bold text-[var(--accent-text)]">
            {marker.coordinateLabel}
          </dd>
        </div>
        {marker.latestProgress ? (
          <div className="col-span-2 rounded-xl bg-[var(--surface-muted)] p-2.5">
            <dt className="text-[10px] font-extrabold uppercase tracking-[0.09em] text-[var(--text-muted)]">
              Latest update
            </dt>
            <dd className="mt-1 line-clamp-2 font-medium leading-5 text-[var(--text-secondary)]">
              {marker.latestProgress}
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-3 grid grid-cols-2 gap-2 pl-1">
        <button type="button" className={secondaryActionClass} onClick={() => onLocate(marker)}>
          Locate
        </button>
        <Link to={`/tickets/${marker.ticketId}`} className={secondaryActionClass}>
          Open Ticket
        </Link>
      </div>
    </article>
  );
}

function FilterControls({ search, status, onSearchChange, onStatusChange }) {
  return (
    <div className="grid gap-3">
      <TextInput
        id="cut-point-search"
        label="Search mapped Tickets"
        placeholder="TT, Title, PIC, Cut Point, update"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
      />
      <SelectField
        id="cut-point-status-filter"
        label="Ticket status"
        value={status}
        options={STATUS_OPTIONS}
        onValueChange={onStatusChange}
      />
    </div>
  );
}

export function CutPointTrackerPage() {
  const navigate = useNavigate();
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
    if (
      selectedTicketId &&
      !visibleMarkers.some((marker) => marker.ticketId === selectedTicketId)
    ) {
      setSelectedTicketId(null);
    }
  }, [selectedTicketId, visibleMarkers]);

  const locateMarker = (marker) => {
    setSelectedTicketId(marker.ticketId);
    mapClientRef.current?.focusMarker(marker.ticketId);
  };

  return (
    <div className="space-y-4 overflow-x-hidden md:space-y-5">
      <header className="spatial-panel-elevated relative overflow-hidden p-5 md:p-6">
        <div
          className="pointer-events-none absolute -right-20 -top-28 h-72 w-72 rounded-full bg-[var(--accent-glow)] blur-3xl"
          aria-hidden="true"
        />
        <div className="relative flex flex-wrap items-end justify-between gap-5">
          <div className="max-w-3xl">
            <p className="spatial-kicker">Geographic incident view</p>
            <h2 className="spatial-title mt-3">Cut Point Tracker</h2>
            <p className="spatial-description mt-4">
              Keep confirmed incident coordinates visible in the same operational context as the
              Ticket itself. The map remains a view of the canonical Ticket dataset, never a second
              location database.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="spatial-chip">{markers.length} confirmed coordinates</span>
              <span className="spatial-chip">{visibleMarkers.length} visible</span>
            </div>
          </div>
          <button type="button" className={secondaryActionClass} onClick={loadTickets}>
            <UiIcon name="refresh" size={15} />
            Refresh data
          </button>
        </div>
      </header>

      {localDevelopmentMode ? (
        <div className="rounded-2xl border border-[var(--border-accent)] bg-[var(--accent-soft)] p-4 text-sm leading-6 text-[var(--text-secondary)] shadow-[var(--shadow-xs)]">
          <span className="font-bold text-[var(--accent-text)]">Local preview.</span> No persisted
          Cut Point records are available until Firebase is configured; the map still uses the
          configured OpenStreetMap-compatible tile source.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[350px_minmax(0,1fr)] md:items-start xl:grid-cols-[390px_minmax(0,1fr)]">
        <section
          className={`order-2 z-[450] -mt-10 rounded-t-[28px] border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] p-4 shadow-[var(--shadow-lg)] backdrop-blur-2xl md:order-1 md:mt-0 md:max-h-[calc(100vh-11rem)] md:rounded-[var(--radius-xl)] md:bg-[var(--surface-panel)] md:shadow-[var(--shadow-md)] ${
            useVirtualizedMarkerList ? 'md:overflow-hidden' : 'md:overflow-y-auto'
          }`}
        >
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[var(--border-default)] md:hidden" />
          <div className="flex items-center justify-between gap-3 pb-4">
            <div>
              <p className="spatial-kicker">Mapped incidents</p>
              <h3 className="mt-1.5 text-base font-bold">Browse Cut Points</h3>
            </div>
            <span className="spatial-chip hidden xl:inline-flex">Max 500</span>
          </div>

          <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-strong)] p-3.5">
            <FilterControls
              search={search}
              status={status}
              onSearchChange={setSearch}
              onStatusChange={setStatus}
            />
          </div>

          {!loading && !queryError ? (
            <p
              className="mt-3 px-1 text-xs font-semibold text-[var(--text-muted)]"
              aria-live="polite"
            >
              Showing {visibleMarkers.length} of {markers.length} mapped Tickets.
            </p>
          ) : null}

          {loading ? (
            <div className="mt-4 grid gap-3" aria-label="Loading mapped Tickets">
              <Skeleton className="h-48" />
              <Skeleton className="h-48" />
            </div>
          ) : null}

          {!loading && queryError ? (
            <div className="mt-4">
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
            <div className="mt-4">
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
                  estimateSize={250}
                  overscan={3}
                  ariaLabel="Mapped incident virtualized list"
                  className="mt-4 hidden h-[calc(100vh-26rem)] min-h-72 max-h-[560px] pr-1 md:block"
                  itemClassName="pb-3"
                  renderItem={(marker) => (
                    <MarkerCard
                      marker={marker}
                      selected={selectedTicketId === marker.ticketId}
                      onLocate={locateMarker}
                    />
                  )}
                />
                <div className="mt-4 grid gap-3 md:hidden">
                  {visibleMarkers.map((marker) => (
                    <MarkerCard
                      key={marker.ticketId}
                      marker={marker}
                      selected={selectedTicketId === marker.ticketId}
                      onLocate={locateMarker}
                    />
                  ))}
                </div>
              </>
            ) : (
              <div className="mt-4 grid gap-3">
                {visibleMarkers.map((marker) => (
                  <MarkerCard
                    key={marker.ticketId}
                    marker={marker}
                    selected={selectedTicketId === marker.ticketId}
                    onLocate={locateMarker}
                  />
                ))}
              </div>
            )
          ) : null}
        </section>

        <section className="order-1 relative min-h-[55vh] overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-muted)] shadow-[var(--shadow-md)] md:order-2 md:min-h-[calc(100vh-11rem)]">
          <div className="pointer-events-none absolute inset-x-4 top-4 z-[490] flex justify-between gap-2">
            <span className="spatial-chip bg-[var(--surface-panel-translucent)]">
              OpenStreetMap context
            </span>
            {selectedTicketId ? (
              <span className="spatial-chip bg-[var(--surface-panel-translucent)]">
                Marker focused
              </span>
            ) : null}
          </div>

          <div ref={mapHostRef} className="absolute inset-0" aria-label="Cut Point map" />

          {!loading && !queryError && visibleMarkers.length === 0 ? (
            <div className="pointer-events-none absolute inset-x-4 top-16 z-[500] rounded-2xl border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] p-3 text-sm shadow-[var(--shadow-sm)] backdrop-blur-xl">
              No eligible markers for the current filter. The basemap remains available for context.
            </div>
          ) : null}

          {tileWarning ? (
            <div className="absolute inset-x-4 top-16 z-[510] rounded-2xl border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3.5 text-sm text-[var(--warning-text)] shadow-[var(--shadow-md)]">
              <p className="font-bold">Basemap tiles are having trouble loading.</p>
              <p className="mt-1 text-xs leading-5">
                Ticket data and coordinates remain available in the list.
              </p>
              <button
                type="button"
                className={`mt-3 ${secondaryActionClass}`}
                onClick={() => setMapRevision((current) => current + 1)}
              >
                <UiIcon name="refresh" size={15} />
                Retry map tiles
              </button>
            </div>
          ) : null}

          {mapError ? (
            <div className="absolute inset-4 z-[520] grid place-items-center rounded-[var(--radius-xl)] border border-[var(--border-subtle)] bg-[var(--surface-panel-translucent)] p-4 text-center shadow-[var(--shadow-lg)] backdrop-blur-xl">
              <div className="max-w-sm">
                <span
                  className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-[var(--danger-soft)] text-[var(--danger-text)]"
                  aria-hidden="true"
                >
                  <UiIcon name="error" size={18} />
                </span>
                <p className="mt-4 font-bold">Map renderer could not start</p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-secondary)]">
                  The Ticket list remains usable. Retry the Leaflet map without reloading Ticket
                  data.
                </p>
                <button
                  type="button"
                  className={`mt-4 ${secondaryActionClass}`}
                  onClick={() => setMapRevision((current) => current + 1)}
                >
                  <UiIcon name="refresh" size={15} />
                  Retry map
                </button>
              </div>
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
