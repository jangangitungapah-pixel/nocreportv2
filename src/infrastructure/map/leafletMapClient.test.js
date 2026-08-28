import { describe, expect, it } from 'vitest';

import {
  MAP_MARKER_TOUCH_SIZE,
  isValidLeafletCoordinate,
  readMapConfig,
  safeFocusZoom,
} from './leafletMapClient.js';

describe('Leaflet map client contract', () => {
  it('keeps map markers at the minimum practical touch target size', () => {
    expect(MAP_MARKER_TOUCH_SIZE).toBe(44);
  });

  it('uses OpenStreetMap-compatible defaults when map env values are empty', () => {
    expect(readMapConfig({ VITE_MAP_TILE_URL: '', VITE_MAP_ATTRIBUTION: '' })).toEqual({
      tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '© OpenStreetMap contributors',
    });
  });

  it('accepts an environment-configured tile source and attribution', () => {
    expect(
      readMapConfig({
        VITE_MAP_TILE_URL: 'https://tiles.example/{z}/{x}/{y}.png',
        VITE_MAP_ATTRIBUTION: 'Example Maps',
      }),
    ).toEqual({
      tileUrl: 'https://tiles.example/{z}/{x}/{y}.png',
      attribution: 'Example Maps',
    });
  });

  it('rejects invalid coordinates before they reach Leaflet', () => {
    expect(isValidLeafletCoordinate(-6.2, 106.8)).toBe(true);
    expect(isValidLeafletCoordinate(Number.NaN, 106.8)).toBe(false);
    expect(isValidLeafletCoordinate(-6.2, Number.NaN)).toBe(false);
    expect(isValidLeafletCoordinate(91, 106.8)).toBe(false);
    expect(isValidLeafletCoordinate(-6.2, 181)).toBe(false);
  });

  it('uses a finite marker focus zoom even when Leaflet reports an invalid zoom', () => {
    expect(safeFocusZoom(8)).toBe(13);
    expect(safeFocusZoom(15)).toBe(15);
    expect(safeFocusZoom(Number.NaN)).toBe(13);
    expect(safeFocusZoom(undefined)).toBe(13);
  });
});
