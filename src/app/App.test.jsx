import { fireEvent, render, screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { AppProviders } from './providers/AppProviders.jsx';
import { routeObjects } from './router.jsx';

function renderRoute(pathname = '/dashboard') {
  const router = createMemoryRouter(routeObjects, { initialEntries: [pathname] });

  return render(
    <AppProviders>
      <RouterProvider router={router} />
    </AppProviders>,
  );
}

describe('application shell', () => {
  beforeEach(() => {
    window.localStorage.clear();
    delete document.documentElement.dataset.theme;
  });

  it('renders the Dashboard inside desktop and mobile navigation shells', () => {
    renderRoute();

    expect(screen.getByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();

    const desktopNavigation = screen.getByRole('navigation', { name: 'Primary navigation' });
    expect(within(desktopNavigation).getByRole('link', { name: /Dashboard/ })).toHaveAttribute(
      'aria-current',
      'page',
    );

    expect(screen.getByRole('navigation', { name: 'Mobile primary navigation' })).toBeInTheDocument();
  });

  it('persists a user-selected dark theme', () => {
    renderRoute();

    fireEvent.click(screen.getByRole('button', { name: 'Switch to dark mode' }));

    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(window.localStorage.getItem('nocreport-theme')).toBe('dark');
    expect(screen.getByRole('button', { name: 'Switch to light mode' })).toBeInTheDocument();
  });

  it('supports the reserved ticket editor route', () => {
    renderRoute('/generator/ticket-123');

    expect(screen.getByRole('heading', { name: 'Template Generator' })).toBeInTheDocument();
    expect(screen.getByText('Ticket form workspace')).toBeInTheDocument();
  });
});
