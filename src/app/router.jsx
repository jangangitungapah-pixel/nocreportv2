import { Navigate, createBrowserRouter } from 'react-router-dom';

import { USER_ROLE } from '../entities/user/authorization.js';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage.jsx';
import { RunningTicketsPage } from '../features/running-tickets/pages/RunningTicketsPage.jsx';
import { TicketGeneratorPage } from '../features/ticket-generator/pages/TicketGeneratorPage.jsx';
import { TicketRoutePage } from '../features/ticket-generator/pages/TicketRoutePage.jsx';
import { AppShell } from './layouts/AppShell.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { NotFoundPage } from './routes/pages.jsx';

async function loadCutPointTrackerRoute() {
  const { CutPointTrackerPage } =
    await import('../features/cut-point-tracker/pages/CutPointTrackerPage.jsx');
  return { Component: CutPointTrackerPage };
}

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
          {
            path: '/generator/new',
            element: (
              <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.OPERATOR]}>
                <TicketGeneratorPage />
              </ProtectedRoute>
            ),
          },
          { path: '/generator/:ticketId', element: <TicketRoutePage /> },
          { path: '/running', element: <RunningTicketsPage /> },
          { path: '/cut-points', lazy: loadCutPointTrackerRoute },
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
