import { RouterProvider } from 'react-router-dom';

import { AppProviders } from './providers/AppProviders.jsx';
import { createAppRouter } from './router.jsx';

const router = createAppRouter();

export default function App() {
  return (
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>
  );
}
