import { Navigate, useLocation, useParams } from 'react-router-dom';

export function TicketRoutePage() {
  const { ticketId } = useParams();
  const location = useLocation();

  const isProgressEditIntent = location.hash === '#progress-text';
  const destination = isProgressEditIntent
    ? `/generator/${ticketId}/edit${location.hash}`
    : `/tickets/${ticketId}`;

  return <Navigate to={destination} replace />;
}
