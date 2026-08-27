import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import {
  GENERATOR_WORKSPACE_COMMAND_EVENT,
  GENERATOR_WORKSPACE_COMMANDS,
} from '../../shared/lib/generatorWorkspaceCommands.js';
import { CommandPalette } from './CommandPalette.jsx';

vi.mock('../providers/AuthProvider.jsx', () => ({
  useAuth: () => ({ can: () => true }),
}));

vi.mock('../providers/ThemeProvider.jsx', () => ({
  useTheme: () => ({ theme: 'light', toggleTheme: vi.fn() }),
}));

function renderPalette(pathname) {
  render(
    <MemoryRouter initialEntries={[pathname]}>
      <CommandPalette />
    </MemoryRouter>,
  );
  fireEvent.keyDown(document, { key: 'k', ctrlKey: true });
  return screen.getByRole('dialog', { name: 'Command palette' });
}

afterEach(() => cleanup());

describe('CommandPalette Generator workspace actions', () => {
  it('shows Generator commands only inside the Generator and dispatches the selected command', () => {
    const listener = vi.fn();
    window.addEventListener(GENERATOR_WORKSPACE_COMMAND_EVENT, listener);

    const palette = renderPalette('/generator/new');
    expect(within(palette).getByText('Copy Report')).toBeInTheDocument();
    expect(within(palette).getByText('Focus Smart Import')).toBeInTheDocument();
    expect(within(palette).getByText('Focus Progress')).toBeInTheDocument();
    expect(within(palette).getByText('Validation Center')).toBeInTheDocument();

    fireEvent.click(within(palette).getByText('Copy Report'));
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener.mock.calls[0][0].detail).toEqual({
      command: GENERATOR_WORKSPACE_COMMANDS.COPY_REPORT,
    });

    window.removeEventListener(GENERATOR_WORKSPACE_COMMAND_EVENT, listener);
  });

  it('hides Smart Import command for an existing Ticket and all Generator commands elsewhere', () => {
    let palette = renderPalette('/generator/ticket-1/edit');
    expect(within(palette).queryByText('Focus Smart Import')).not.toBeInTheDocument();
    expect(within(palette).getByText('Focus Progress')).toBeInTheDocument();
    cleanup();

    palette = renderPalette('/running-ticket');
    expect(within(palette).queryByText('Copy Report')).not.toBeInTheDocument();
    expect(within(palette).queryByText('Focus Progress')).not.toBeInTheDocument();
  });
});
