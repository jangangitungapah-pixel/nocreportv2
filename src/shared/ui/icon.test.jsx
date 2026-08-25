import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AppIcon, appIconNames } from './icon.jsx';

describe('AppIcon', () => {
  it('exposes the canonical icon vocabulary', () => {
    expect(appIconNames).toContain('dashboard');
    expect(appIconNames).toContain('generator');
    expect(appIconNames).toContain('running');
    expect(appIconNames).toContain('map');
    expect(appIconNames).toContain('archive');
  });

  it('renders Lucide artwork as presentation-only SVG', () => {
    const { container } = render(
      <span aria-label="Dashboard icon">
        <AppIcon name="dashboard" />
      </span>,
    );

    expect(screen.getByLabelText('Dashboard icon')).toBeInTheDocument();
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
  });
});
