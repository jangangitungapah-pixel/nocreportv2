import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { TICKET_STATUS } from '../../../entities/ticket/index.js';
import { firestoreTicketRepository } from '../../../infrastructure/firebase/index.js';
import { createLeafletMap, readMapConfig } from '../../../infrastructure/map/index.js';
import { EmptyState, ErrorState, Skeleton, StatusBadge, TextInput } from '../../../shared/ui/index.jsx';
import { buildCutPointMarkers, filterCutPointMarkers } from '../lib/mapData.js';

const selectClass =
  'min-h-11 w-full rounded-lg border border-[var(--border-default)] bg-[var(--surface-panel)] px-3 text-sm text-[var(--text-primary)] outline-none transition focus:border-[var(--accent-solid)] focus:ring-2 focus:ring-[var(--focus-ring)]';
const secondaryActionClass =
  'inline-flex min-h-10 items-center justify-center rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)] px-3 text-xs font-semibold transition hover:bg-[var(--surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]';

function MarkerCard({ marker, selected, onLocate }) {
  return (
    <article
      className={`rounded-xl border p-3 transition ${
        selected
          ? 'border-[var(--accent-solid)] bg-[var(--accent-soft)]'
          : 'border-[var(--border-subtle)] bg-[var(--surface-panel)]'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="font-mono text-xs font-semibold text-[var(--text-secondary)]">
            {marker.externalTtNumber ?? 'No TT detected'}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-bold">{marker.title}</h3>
        </div>
        <StatusBadge status={marker.status} />
      </div>
      <dl className="mt-3 grid gap-2 text-xs">
        <div>
          <dt className="font-semibold text-[var(--text-muted)]">Cut Point</dt>
          <dd className="mt-0.5 line-clamp-2 text-[var(--text-secondary)]">
            {marker.cutPoint || '—'}
          </dd>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <dt className="font-semibold text-[var(--text-muted)]">PIC</dt>
            <dd className="mt-0.5 truncate text-[var(--text-secondary)]">{marker.pic || '—'}</dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--text-muted)]">Coordinate</dt>
            <dd className="mt-0.5 font-mono text-[var(--text-secondary)]">
              {marker.coordinateLabel}
            </dd>
          </div>
        </div>
        {marker.latestProgress ? (
          <div>
            <dt className="font-semibold text-[var(--text-muted)]">Latest update</dt>
            <dd className="mt-0.5 line-clamp-2 text-[var(--text-secondary)]">
              {marker.latestProgress}
            </dd>
          </div>
        ) : null}
      </dl>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button type="button" className={secondaryActionClass} onClick={() => onLocate(marker)}>
          Locate
        </button>
        <Link to={`/generator/${marker.ticketId}`} className={secondaryActionClass}>
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
      <label className="block text-sm font-medium text-[var(--text-secondary)]">
        Ticket status
        <select
          className={`mt-1.5 ${selectClass}`}
          value={status}
          aria-label="Cut Point status filter"
          onChange={(event) => onStatusChange(event.target.value)}
        >
          <option value="ALL">Running + Resolved</option>
          <option value={TICKET_STATUS.RUNNING}>Running</option>
          <option value={TICKET_STATUS.RESOLVED}>Resolved</option>
        </select>
      </label>
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
      onOpenTicket: (ticketId) => navigate(`/generator/${ticketId}`),
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
    <div className="space-y-4 overflow-x-hidden">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--text-muted)]">Geographic incident view</p>
          <h2 className="mt-1 text-2xl font-bold tracking-tight">Cut Point Tracker</h2>
          <p className="mt-1 text-xs text-[var(--text-secondary)]">
            {markers.length} confirmed Ticket coordinates · one canonical Ticket dataset
          </p>
        </div>
        <button type="button" className={secondaryActionClass} onClick={loadTickets}>
          Refresh data
        </button>
      </header>

      {localDevelopmentMode ? (
        <div className="rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] p-4 text-sm text-[var(--text-secondary)]">
          Local preview mode has no persisted Cut Point records. Configure Firebase to load confirmed
          Ticket coordinates; the map still uses the configured OpenStreetMap-compatible tile source.
        </div>
      ) : null}

      <div className="grid gap-4 md:grid-cols-[340px_minmax(0,1fr)] md:items-start xl:grid-cols-[380px_minmax(0,1fr)]">
        <section className="order-2 -mt-8 z-[450] rounded-t-2xl border border-[var(--border-subtle)] bg-[var(--surface-canvas)] p-4 shadow-[var(--shadow-md)] md:order-1 md:mt-0 md:max-h-[calc(100vh-11rem)] md:overflow-y-auto md:rounded-xl md:bg-[var(--surface-panel)] md:shadow-[var(--shadow-sm)]">
          <div className="mx-auto mb-3 h-1.5 w-12 rounded-full bg-[var(--border-default)] md:hidden" />
          <FilterControls
            search={search}
            status={status}
            onSearchChange={setSearch}
            onStatusChange={setStatus}
          />

          {!loading && !queryError ? (
            <p className="mt-3 text-xs text-[var(--text-muted)]" aria-live="polite">
              Showing {visibleMarkers.length} of {markers.length} mapped Tickets.
            </p>
          ) : null}

          {loading ? (
            <div className="mt-4 grid gap-3" aria-label="Loading mapped Tickets">
              <Skeleton className="h-44" />
              <Skeleton className="h-44" />
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
          ) : null}
        </section>

        <section className="order-1 relative min-h-[52vh] overflow-hidden rounded-xl border border-[var(--border-subtle)] bg-[var(--surface-muted)] shadow-[var(--shadow-sm)] md:order-2 md:min-h-[calc(100vh-11rem)]">
          <div ref={mapHostRef} className="absolute inset-0" aria-label="Cut Point map" />

          {!loading && !queryError && visibleMarkers.length === 0 ? (
            <div className="pointer-events-none absolute inset-x-4 top-4 z-[500] rounded-lg border border-[var(--border-subtle)] bg-[var(--surface-panel)]/95 p-3 text-sm shadow-[var(--shadow-sm)]">
              No eligible markers for the current filter. The basemap remains available for context.
            </div>
          ) : null}

          {tileWarning ? (
            <div className="absolute inset-x-4 top-4 z-[510] rounded-lg border border-[var(--warning-border)] bg-[var(--warning-soft)] p-3 text-sm text-[var(--warning-text)] shadow-[var(--shadow-sm)]">
              <p className="font-semibold">Basemap tiles are having trouble loading.</p>
              <p className="mt-1 text-xs">Ticket data and coordinates remain available in the list.</p>
              <button
                type="button"
                className={`mt-2 ${secondaryActionClass}`}
                onClick={() => setMapRevision((current) => current + 1)}
              >
                Retry map tiles
              </button>
            </div>
          ) : null}

          {mapError ? (
            <div className="absolute inset-4 z-[520] grid place-items-center rounded-xl bg-[var(--surface-panel)]/95 p-4 text-center shadow-[var(--shadow-md)]">
              <div>
                <p className="font-bold">Map renderer could not start</p>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">
                  The Ticket list remains usable. Retry the Leaflet map without reloading Ticket data.
                </p>
                <button
                  type="button"
                  className={`mt-3 ${secondaryActionClass}`}
                  onClick={() => setMapRevision((current) => current + 1)}
                >
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
