import { Navigate, createBrowserRouter } from 'react-router-dom';

import { USER_ROLE } from '../entities/user/authorization.js';
import { LoginPage } from '../features/auth/pages/LoginPage.jsx';
import { DashboardPage } from '../features/dashboard/pages/DashboardPage.jsx';
import { RunningTicketsPage } from '../features/running-tickets/pages/RunningTicketsPage.jsx';
import { AppShell } from './layouts/AppShell.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import { NotFoundPage } from './routes/pages.jsx';

async function loadNewTicketRoute() {
  const { TicketGeneratorPage } =
    await import('../features/ticket-generator/pages/TicketGeneratorPage.jsx');

  function NewTicketRoute() {
    return (
      <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN, USER_ROLE.OPERATOR]}>
        <TicketGeneratorPage />
      </ProtectedRoute>
    );
  }

  return { Component: NewTicketRoute };
}

async function loadTicketDetailRoute() {
  const { TicketViewerPage } =
    await import('../features/ticket-generator/pages/TicketViewerPage.jsx');
  return { Component: TicketViewerPage };
}

async function loadTicketRoute() {
  const { TicketRoutePage } =
    await import('../features/ticket-generator/pages/TicketRoutePage.jsx');
  return { Component: TicketRoutePage };
}

async function loadCutPointTrackerRoute() {
  const { CutPointTrackerPage } =
    await import('../features/cut-point-tracker/pages/CutPointTrackerPage.jsx');
  return { Component: CutPointTrackerPage };
}

async function loadArchiveRoute() {
  const { ArchiveManagementPage } =
    await import('../features/archive/pages/ArchiveManagementPage.jsx');

  function ArchiveRoute() {
    return (
      <ProtectedRoute allowedRoles={[USER_ROLE.ADMIN]}>
        <ArchiveManagementPage />
      </ProtectedRoute>
    );
  }

  return { Component: ArchiveRoute };
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
          { path: '/generator/new', lazy: loadNewTicketRoute },
          { path: '/tickets/:ticketId', lazy: loadTicketDetailRoute },
          { path: '/generator/:ticketId/edit', lazy: loadTicketRoute },
          { path: '/generator/:ticketId', lazy: loadTicketRoute },
          { path: '/running', element: <RunningTicketsPage /> },
          { path: '/cut-points', lazy: loadCutPointTrackerRoute },
          { path: '/archive', lazy: loadArchiveRoute },
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
