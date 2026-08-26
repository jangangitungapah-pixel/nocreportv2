import { useEffect, useState } from 'react';

import { loadTicketRevisionHistory } from '../lib/persistenceService.js';
import { RevisionHistoryPanel } from './RevisionHistoryPanel.jsx';

const MAX_REVISION_HISTORY = 50;

export function RevisionHistoryWorkspace({ ticketId, enabled = false }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!enabled || !ticketId) {
      setEvents([]);
      setLoading(false);
      setError(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    setError(null);

    void loadTicketRevisionHistory(ticketId, { limit: MAX_REVISION_HISTORY })
      .then((items) => {
        if (active) setEvents(items);
      })
      .catch((loadError) => {
        if (active) {
          setEvents([]);
          setError(loadError);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [enabled, ticketId]);

  if (!enabled || !ticketId) return null;
  return <RevisionHistoryPanel events={events} loading={loading} error={error} />;
}
