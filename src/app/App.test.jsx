import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import App from './App.jsx';

describe('App foundation', () => {
  it('renders the NOC Report Template Generator heading', () => {
    render(<App />);

    expect(
      screen.getByRole('heading', { name: 'NOC Report Template Generator' }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText('Current implementation phase')).toHaveTextContent(
      'T0 · Repository Foundation',
    );
  });
});
