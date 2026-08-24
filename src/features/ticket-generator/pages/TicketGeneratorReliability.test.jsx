import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createMemoryRouter, RouterProvider } from 'react-router-dom';

import { ToastProvider } from '../../../app/providers/ToastProvider.jsx';
import { TicketGeneratorPage } from './TicketGeneratorPage.jsx';

const persistenceMocks = vi.hoisted(() => ({
  createTicketEditor: vi.fn(),
}));

vi.mock('../../../app/providers/AuthProvider.jsx', async (importOriginal) => ({
  ...(await importOriginal()),
  useAuth: () => ({ localDevelopmentMode: false }),
}));

vi.mock('../lib/persistenceService.js', async (importOriginal) => ({
  ...(await importOriginal()),
  createTicketEditor: persistenceMocks.createTicketEditor,
}));

function renderCloudGenerator() {
  const router = createMemoryRouter(
    [{ path: '/generator/new', element: <TicketGeneratorPage /> }],
    { initialEntries: ['/generator/new'] },
  );

  return render(
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>,
  );
}

describe('Template Generator persistence recovery', () => {
  beforeEach(() => {
    persistenceMocks.createTicketEditor.mockReset();
    persistenceMocks.createTicketEditor.mockRejectedValue({ code: 'NETWORK_ERROR' });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('retains unsaved form data after a network save failure and allows retry', async () => {
    renderCloudGenerator();

    const title = screen.getByRole('textbox', { name: /Title/ });
    fireEvent.change(title, {
      target: { value: '[MANDAU] RETRYABLE LINK DOWN' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(persistenceMocks.createTicketEditor).toHaveBeenCalledTimes(1));
    expect(await screen.findByText('Save failed')).toBeInTheDocument();
    expect(
      screen.getByText(
        'The network/Firebase service is unavailable. Your unsaved form data is still on screen.',
      ),
    ).toBeInTheDocument();
    expect(title).toHaveValue('[MANDAU] RETRYABLE LINK DOWN');

    const retryButton = screen.getByRole('button', { name: 'Save' });
    await waitFor(() => expect(retryButton).toBeEnabled());
    fireEvent.click(retryButton);

    await waitFor(() => expect(persistenceMocks.createTicketEditor).toHaveBeenCalledTimes(2));
    expect(title).toHaveValue('[MANDAU] RETRYABLE LINK DOWN');
  });
});
