import { describe, expect, it } from 'vitest';
import { applyAccent, hexToOklch, isValidHex } from './accent';

describe('hexToOklch', () => {
  it('maps pure white and black to the lightness extremes', () => {
    expect(hexToOklch('#FFFFFF').l).toBeCloseTo(1, 2);
    expect(hexToOklch('#000000').l).toBeCloseTo(0, 2);
  });

  it('keeps greys chroma-free', () => {
    expect(hexToOklch('#808080').c).toBeCloseTo(0, 2);
  });

  it('places the default blue in the blue hue range', () => {
    const { h, c } = hexToOklch('#3B82F6');
    expect(h).toBeGreaterThan(240);
    expect(h).toBeLessThan(280);
    expect(c).toBeGreaterThan(0.1);
  });
});

describe('isValidHex', () => {
  it.each(['#3B82F6', '#000000', '#ffffff'])('accepts %s', (value) => {
    expect(isValidHex(value)).toBe(true);
  });

  it.each(['3B82F6', '#3B82F', '#GGGGGG', ''])('rejects %s', (value) => {
    expect(isValidHex(value)).toBe(false);
  });
});

describe('applyAccent', () => {
  it('writes the accent tokens', () => {
    const root = document.createElement('div');
    applyAccent('#3B82F6', root);

    expect(root.style.getPropertyValue('--accent-base')).toMatch(/^oklch\(/);
    expect(root.style.getPropertyValue('--accent-base-hover')).toMatch(/^oklch\(/);
    expect(root.style.getPropertyValue('--accent-on')).toBe('oklch(0.985 0 0)');
  });

  it('flips the on-accent colour to dark for light accents', () => {
    const root = document.createElement('div');
    applyAccent('#FDE047', root);

    expect(root.style.getPropertyValue('--accent-on')).toBe('oklch(0.205 0 0)');
  });

  it('ignores an invalid hex', () => {
    const root = document.createElement('div');
    applyAccent('nope', root);

    expect(root.style.getPropertyValue('--accent-base')).toBe('');
  });
});
