// The host is a desktop window, not a server: there is nothing to render ahead of time and
// no request to render it for. Every route is client-side only.
export const ssr = false;
export const prerender = false;
