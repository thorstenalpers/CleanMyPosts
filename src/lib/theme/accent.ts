/**
 * Turns the hex accent colour stored by the host into the OKLCH tokens `app.css`
 * builds `--primary`/`--ring` from. OKLCH keeps lightness perceptually stable, so
 * the hover shade and the on-accent text colour hold up for any user-picked hue.
 */

export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const ACCENT_PRESETS = [
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Violet', hex: '#8B5CF6' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Red', hex: '#EF4444' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Rose', hex: '#F43F5E' },
  { name: 'Cyan', hex: '#06B6D4' },
  { name: 'Slate', hex: '#64748B' }
] as const;

export const accentPresets: readonly { name: string; hex: string }[] = ACCENT_PRESETS;

export function isValidHex(value: string): boolean {
  return /^#[0-9a-fA-F]{6}$/.test(value);
}

export function hexToOklch(hex: string): Oklch {
  const channel = (i: number) => srgbToLinear(parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = [channel(1), channel(3), channel(5)];

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const okL = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const okA = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const okB = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const hue = (Math.atan2(okB, okA) * 180) / Math.PI;
  return {
    l: round(okL),
    c: round(Math.hypot(okA, okB)),
    h: round(hue < 0 ? hue + 360 : hue)
  };
}

export function formatOklch({ l, c, h }: Oklch): string {
  return `oklch(${l} ${c} ${h})`;
}

/** Writes the accent tokens onto the document root; a missing/invalid hex leaves the CSS defaults alone. */
export function applyAccent(hex: string, root: HTMLElement = document.documentElement): void {
  if (!isValidHex(hex)) {
    return;
  }

  const accent = hexToOklch(hex);
  root.style.setProperty('--accent-base', formatOklch(accent));
  root.style.setProperty('--accent-base-hover', formatOklch({ ...accent, l: round(Math.max(0, accent.l - 0.06)) }));
  // Above this lightness a white label on the accent no longer meets contrast.
  root.style.setProperty('--accent-on', accent.l > 0.68 ? 'oklch(0.205 0 0)' : 'oklch(0.985 0 0)');
}

function srgbToLinear(value: number): number {
  return value <= 0.04045 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
}

function round(value: number): number {
  return Math.round(value * 1000) / 1000;
}
