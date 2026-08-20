import { Navigate, createBrowserRouter } from 'react-router-dom';

import { AppShell } from './layouts/AppShell.jsx';
import { ProtectedRoute } from './routes/ProtectedRoute.jsx';
import {
  CutPointTrackerPage,
  DashboardPage,
  GeneratorPage,
  LoginPage,
  NotFoundPage,
  RunningTicketsPage,
} from './routes/pages.jsx';

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
          { path: '/generator/new', element: <GeneratorPage /> },
          { path: '/generator/:ticketId', element: <GeneratorPage /> },
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
