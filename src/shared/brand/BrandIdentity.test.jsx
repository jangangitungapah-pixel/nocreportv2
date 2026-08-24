import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { BrandLockup, BrandMark } from './BrandIdentity.jsx';

afterEach(() => {
  cleanup();
});

describe('BrandIdentity', () => {
  it('uses the canonical production logo asset', () => {
    const { container } = render(<BrandMark eager />);
    const image = container.querySelector('img');

    expect(image).toHaveAttribute('src', '/brand/noc-report-logo.png');
    expect(image).toHaveAttribute('loading', 'eager');
  });

  it('exposes the product name through the lockup', () => {
    render(<BrandLockup subtitle="Operations Workspace" />);

    expect(screen.getByLabelText('NOC Report')).toBeInTheDocument();
    expect(screen.getByText('Operations Workspace')).toBeInTheDocument();
  });
});
