import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { CAPABILITY } from '../../entities/user/authorization.js';
import { CommandPalette } from './CommandPalette.jsx';

let allowedCapabilities = new Set();

vi.mock('../providers/AuthProvider.jsx', () => ({
  useAuth: () => ({
    can: (capability) => allowedCapabilities.has(capability),
  }),
}));

vi.mock('../providers/ThemeProvider.jsx', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

function renderPalette() {
  render(
    <MemoryRouter>
      <CommandPalette />
    </MemoryRouter>,
  );
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
  return screen.getByRole('dialog', { name: 'Command palette' });
}

afterEach(() => {
  cleanup();
  allowedCapabilities = new Set();
});

describe('CommandPalette capability filtering', () => {
  it('shows create commands to an Operator while hiding Admin-only archive commands', () => {
    allowedCapabilities = new Set([CAPABILITY.CREATE_TICKET]);

    const palette = renderPalette();

    expect(within(palette).getByText('Template Generator')).toBeInTheDocument();
    expect(within(palette).queryByText('Archive & Restore')).not.toBeInTheDocument();
    expect(within(palette).getByText('Running Ticket')).toBeInTheDocument();
  });

  it('hides mutation commands from a Viewer while preserving read-only navigation', () => {
    const palette = renderPalette();

    expect(within(palette).queryByText('Template Generator')).not.toBeInTheDocument();
    expect(within(palette).queryByText('Archive & Restore')).not.toBeInTheDocument();
    expect(within(palette).getByText('Dashboard')).toBeInTheDocument();
    expect(within(palette).getByText('Running Ticket')).toBeInTheDocument();
    expect(within(palette).getByText('Cut Point Tracker')).toBeInTheDocument();
  });
});
