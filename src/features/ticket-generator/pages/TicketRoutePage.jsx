import { useAuth } from '../../../app/providers/AuthProvider.jsx';
import { CAPABILITY } from '../../../entities/user/authorization.js';
import { TicketGeneratorPage } from './TicketGeneratorPage.jsx';
import { TicketViewerPage } from './TicketViewerPage.jsx';

export function TicketRoutePage() {
  const { can } = useAuth();
  return can(CAPABILITY.EDIT_TICKET) ? <TicketGeneratorPage /> : <TicketViewerPage />;
}
