import { describe, expect, it } from 'vitest';

import { cn } from './cn.js';

describe('cn', () => {
  it('merges conditional classes and resolves Tailwind conflicts', () => {
    expect(cn('px-2', false && 'hidden', ['font-bold', 'px-4'])).toBe('font-bold px-4');
  });
});
