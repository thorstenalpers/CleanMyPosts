// Prerendered, so the shell — sidebar, header, the active page — is already in the HTML
// the webview receives. It paints before any JavaScript has run; hydration only takes over
// the interactivity afterwards.
export const prerender = true;
export const ssr = true;
