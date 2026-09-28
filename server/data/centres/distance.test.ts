import { describe, it, expect } from 'vitest';
import { haversineKm, attachDistances } from './distance';

describe('haversineKm', () => {
  it('returns ~0 for identical points', () => {
    expect(haversineKm(25.3176, 82.9739, 25.3176, 82.9739)).toBeCloseTo(0, 6);
  });

  it('computes the known Varanasi→Gorakhpur distance (~165 km)', () => {
    const d = haversineKm(25.3176, 82.9739, 26.7606, 83.3732);
    expect(d).toBeGreaterThan(150);
    expect(d).toBeLessThan(180);
  });

  it('is symmetric', () => {
    const a = haversineKm(25.3176, 82.9739, 26.7606, 83.3732);
    const b = haversineKm(26.7606, 83.3732, 25.3176, 82.9739);
    expect(a).toBeCloseTo(b, 6);
  });

  it('returns NaN when coordinates are missing', () => {
    expect(Number.isNaN(haversineKm(undefined, 82, 25, 83))).toBe(true);
    expect(Number.isNaN(haversineKm(25, 82, null, 83))).toBe(true);
  });

  it('returns NaN for out-of-range latitude', () => {
    expect(Number.isNaN(haversineKm(120, 82, 25, 83))).toBe(true);
    expect(Number.isNaN(haversineKm(25, 82, 91, 83))).toBe(true);
  });

  it('returns NaN for out-of-range longitude', () => {
    expect(Number.isNaN(haversineKm(25, 200, 25, 83))).toBe(true);
    expect(Number.isNaN(haversineKm(25, 82, 25, 181))).toBe(true);
  });
});

describe('attachDistances', () => {
  const centres = [
    { id: 'a', name: 'A', latitude: 25.3176, longitude: 82.9739, distanceKm: 999 },
    { id: 'b', name: 'B', latitude: 26.7606, longitude: 83.3732, distanceKm: 999 },
    { id: 'c', name: 'C', latitude: undefined, longitude: undefined, distanceKm: 7 },
  ];

  it('computes real distances when a user location is supplied', () => {
    const out = attachDistances(centres, 25.3176, 82.9739);
    expect(out[0].distanceKm).toBeCloseTo(0, 6);
    expect(out[0].fromDataset).toBe(false);
    expect(out[1].distanceKm).toBeGreaterThan(150);
    expect(out[1].distanceKm).toBeLessThan(180);
    expect(out[2].distanceKm).toBe(7);
    expect(out[2].fromDataset).toBe(true);
  });

  it('keeps dataset distances when no user location is supplied', () => {
    const out = attachDistances(centres, null, null);
    expect(out[0].distanceKm).toBe(999);
    expect(out[0].fromDataset).toBe(true);
    expect(out[2].distanceKm).toBe(7);
  });

  it('returns null distance when a centre has no coords and no dataset value', () => {
    const out = attachDistances(
      [{ id: 'x', name: 'X', latitude: undefined, longitude: undefined, distanceKm: undefined }],
      25.3, 83.0
    );
    expect(out[0].distanceKm).toBeNull();
    expect(out[0].fromDataset).toBe(true);
  });
});