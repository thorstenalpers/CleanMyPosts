/**
 * Where the site webview starts. The chrome webview covers the whole window and the site is
 * laid on top of it, inset by the app's own columns and by the header bar — the host cannot
 * see either, so the layout reports them via `layout.setSiteInset`. Kept here rather than in
 * the components so the numbers are a plain module import on both sides.
 */
export const SIDEBAR_EXPANDED_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 56;
/** In step with the action rail's `w-56`. */
export const ACTION_RAIL_WIDTH = 224;
/** In step with the header bar's `h-11`. */
export const HEADER_HEIGHT = 44;
/** In step with the status bar's `h-9`. The host shortens the site webview by this much. */
export const STATUS_BAR_HEIGHT = 36;
