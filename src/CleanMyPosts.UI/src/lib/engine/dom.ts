import type { ContentMessage } from './protocol';

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** True for an element that is rendered, laid out, and not disabled. */
export function isVisible(el: Element | null): el is HTMLElement {
  if (!el) return false;
  const htmlEl = el as HTMLElement;
  if ('disabled' in htmlEl && (htmlEl as HTMLButtonElement).disabled) return false;
  return htmlEl.offsetParent !== null || htmlEl.getClientRects().length > 0;
}

export interface WaitForOptions {
  maxWaitMs?: number;
  intervalMs?: number;
  /** Called on every unsuccessful tick, e.g. to scroll the page into view of new content. */
  onTick?: () => void;
}

/** Polls `check` until it returns a truthy value or `maxWaitMs` elapses. */
export async function waitFor<T>(check: () => T, options: WaitForOptions = {}): Promise<T | undefined> {
  const { maxWaitMs = 5000, intervalMs = 200, onTick } = options;
  const start = Date.now();

  while (true) {
    const result = check();
    if (result) return result;

    if (Date.now() - start >= maxWaitMs) return undefined;

    onTick?.();
    await delay(intervalMs);
  }
}

/** `waitFor` with a `window.scrollBy` side effect — the common "load more by scrolling" pattern. */
export function waitForByScrolling<T>(
  check: () => T,
  scrollBy = 500,
  options: Omit<WaitForOptions, 'onTick'> = {}
): Promise<T | undefined> {
  return waitFor(check, { ...options, onTick: () => window.scrollBy(0, scrollBy) });
}

let cursorEl: HTMLElement | null = null;

function ensureCursor(): HTMLElement {
  if (cursorEl && document.body.contains(cursorEl)) return cursorEl;
  cursorEl = document.createElement('div');
  cursorEl.textContent = '👆';
  cursorEl.style.cssText =
    'position:fixed;z-index:2147483647;pointer-events:none;font-size:26px;line-height:1;' +
    'transform:translate(-6px,-4px);transition:left .2s ease,top .2s ease;filter:drop-shadow(0 1px 2px rgba(0,0,0,.5));';
  document.body.appendChild(cursorEl);
  return cursorEl;
}

/** Briefly outlines an element so the user can see which item (post, video, …) is being deleted. */
export function highlightElement(el: HTMLElement, durationMs = 1500): void {
  const prevOutline = el.style.outline;
  const prevOffset = el.style.outlineOffset;
  const prevBackground = el.style.backgroundColor;
  el.style.outline = '3px solid #ff3b30';
  el.style.outlineOffset = '-3px';
  el.style.backgroundColor = 'rgba(255,59,48,.08)';
  setTimeout(() => {
    if (!document.contains(el)) return;
    el.style.outline = prevOutline;
    el.style.outlineOffset = prevOffset;
    el.style.backgroundColor = prevBackground;
  }, durationMs);
}

/** Clicks `el` after moving a visible pointer marker + ripple to its centre, so the user can follow the automation. */
export function clickWithCursor(el: HTMLElement): void {
  const rect = el.getBoundingClientRect();
  const x = rect.left + rect.width / 2;
  const y = rect.top + rect.height / 2;

  const cursor = ensureCursor();
  cursor.style.left = `${x}px`;
  cursor.style.top = `${y}px`;

  const ripple = document.createElement('div');
  ripple.style.cssText =
    `position:fixed;left:${x}px;top:${y}px;z-index:2147483646;pointer-events:none;` +
    'width:20px;height:20px;margin:-10px 0 0 -10px;border:2px solid #ff3b30;border-radius:50%;' +
    'background:rgba(255,59,48,.25);transition:transform .4s ease,opacity .4s ease;';
  document.body.appendChild(ripple);
  requestAnimationFrame(() => {
    ripple.style.transform = 'scale(2.4)';
    ripple.style.opacity = '0';
  });
  setTimeout(() => ripple.remove(), 450);

  el.click();
}

function post(message: ContentMessage): void {
  window.chrome?.webview?.postMessage(message);
}

export function postLog(level: 'info' | 'warning' | 'error', message: string): void {
  post({ type: 'log', level, message });
}

export function postProgress(requestId: string, deletedCount: number, message?: string): void {
  post({ type: 'progress', requestId, deletedCount, message });
}

export function postDone(requestId: string, deletedCount: number): void {
  post({ type: 'done', requestId, deletedCount });
}

/** Resolves the host's pending call with a failure instead of leaving it hanging. */
export function postError(requestId: string, message: string): void {
  post({ type: 'error', requestId, message });
}
