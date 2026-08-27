import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router-dom';

import { PageHeader } from './PageHeader.jsx';

function renderHeader(pathname, props = {}) {
  return render(
    <MemoryRouter initialEntries={[pathname]}>
      <PageHeader {...props} />
    </MemoryRouter>,
  );
}

afterEach(() => {
  cleanup();
});

describe('PageHeader route metadata', () => {
  it('derives the shell title and context from the current route', () => {
    renderHeader('/tickets/ticket-123', { variant: 'shell' });

    expect(screen.getByRole('heading', { level: 1, name: 'Ticket Detail' })).toBeInTheDocument();
    expect(screen.getByText('Safe review')).toBeInTheDocument();
  });

  it('supports page-level overrides without losing the shared header contract', () => {
    renderHeader('/archive', {
      title: 'Resolved history',
      description: 'Review bounded lifecycle history.',
    });

    expect(screen.getByRole('heading', { level: 2, name: 'Resolved history' })).toBeInTheDocument();
    expect(screen.getByText('Lifecycle history')).toBeInTheDocument();
    expect(screen.getByText('Review bounded lifecycle history.')).toBeInTheDocument();
  });
});
