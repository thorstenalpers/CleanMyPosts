/**
 * The chrome webview is only as wide as what the UI puts in it, and the Rust host cannot
 * see that — the layout reports the sum via `layout.setChromeWidth`. Kept here rather than
 * in the components so the number is a plain module import on both sides.
 */
export const SIDEBAR_EXPANDED_WIDTH = 240;
export const SIDEBAR_COLLAPSED_WIDTH = 56;
/** In step with the action rail's `w-56`. */
export const ACTION_RAIL_WIDTH = 224;
