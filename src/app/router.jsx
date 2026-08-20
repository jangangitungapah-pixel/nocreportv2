import { Navigate, createBrowserRouter } from 'react-router-dom';

import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage.jsx';
import { RunningTicketsPage } from '../features/running-tickets/pages/RunningTicketsPage.jsx';
import { TicketGeneratorPage } from '../features/ticket-generator/pages/TicketGeneratorPage.jsx';
import { AppShell } from './layouts/AppShell.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { CutPointTrackerPage, NotFoundPage } from './routes/pages.jsx';

export const routeObjects = [
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppShell />,
        children: [
          { index: true, element: <Navigate to="/dashboard" replace /> },
          { path: '/dashboard', element: <DashboardPage /> },
          { path: '/generator/new', element: <TicketGeneratorPage /> },
          { path: '/generator/:ticketId', element: <TicketGeneratorPage /> },
          { path: '/running', element: <RunningTicketsPage /> },
          { path: '/cut-points', element: <CutPointTrackerPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
];

export function createAppRouter() {
  return createBrowserRouter(routeObjects);
}
