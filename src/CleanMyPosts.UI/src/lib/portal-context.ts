/**
 * Dialog/overlay portals default to `document.body`, which is correct for
 * the local app but would escape the Shadow DOM boundary — and its styles —
 * when running as the injected sidebar overlay. `content-entry.ts` sets this
 * once, synchronously, before mounting the injected app; there is at most
 * one mounted app per page/realm, so a module-level value (rather than
 * Svelte context, which only works inside a component's own init) is fine.
 */
let portalTarget: Element | undefined;

export function setPortalTarget(target: Element | undefined): void {
  portalTarget = target;
}

export function getPortalTarget(): Element | undefined {
  return portalTarget;
}
