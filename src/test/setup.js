import '@testing-library/jest-dom/vitest';

class TestResizeObserver {
  observe() {}

  unobserve() {}

  disconnect() {}
}

globalThis.ResizeObserver ??= TestResizeObserver;
globalThis.HTMLElement.prototype.scrollIntoView ??= () => undefined;
