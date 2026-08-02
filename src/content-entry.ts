// Content build entry: the single IIFE injected into x.com / youtube.com via
// AddScriptToExecuteOnDocumentCreatedAsync. It only exposes the delete engine
// (`window.__cmp`) — the sidebar UI lives in the separate chrome WebView, never
// injected into the platform page.
import './lib/engine/content-entry';
