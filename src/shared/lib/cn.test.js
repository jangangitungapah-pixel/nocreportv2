import { describe, expect, it } from 'vitest';

import { cn } from './cn.js';

describe('cn', () => {
  it('merges conditional classes and resolves Tailwind conflicts', () => {
    const showHidden = Math.random() > 2;
    expect(cn('px-2', showHidden && 'hidden', ['font-bold', 'px-4'])).toBe('font-bold px-4');
  });
});
