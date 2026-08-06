# Feature: Settings

## Persistence

All settings live in one file, `settings.json` under Tauri's `app_config_dir`
(`%AppData%\com.thorstenalpers.cleanmyposts\`), owned by `SettingsStore`
(`src-tauri/src/settings.rs`). Window size, position and maximized state live beside it in
`.window-state.json`, written by `tauri-plugin-window-state`.

The assistant's API keys are the one thing that is **not** here: they go into the Windows
Credential Manager. See [15-feature-assistant.md](15-feature-assistant.md).

It is read once on start-up and written immediately on every change. The enum is stored as
its name, not a number, so the file stays readable.

`SettingsStore::load` falls back to defaults when the file is missing or cannot be parsed.
Settings are user state, not a contract — a file left behind by an older version must never
block start-up. That is the migration story; there is no version field and no migration code.

## Settings fields

```ts
type AppSettings = {
	theme: 'Default' | 'Light' | 'Dark';
	// System follows the language Windows runs in; `ar` also flips the shell to RTL
	language: 'System' | 'en' | 'ar' | 'de' | 'es' | 'fr' | 'hi' | 'it' | 'ja' | 'pt' | 'ru' | 'zh';
	showIntro: boolean; // the explainer card on the overview
	showLogs: boolean;
	showX: boolean; // whether the sidebar offers the platform at all
	showYouTube: boolean;
	confirmDeletion: boolean;
	notifications: boolean; // the toast when a run ends; it fades after a second
	telemetry: boolean; // there is none — this governs the local log buffer
	autoConsent: boolean; // whether the content script clicks cookie banners away
	persistSession: boolean; // off wipes the WebView2 profile at the next start
	themePreset: 'Default' | 'Claude' | 'Cosmic' | 'Supabase' | 'Graphite';
	showAssistant: boolean;
	assistantSource: string; // 'claude-code' for the local binary, else a provider id
	assistantCliPath: string; // empty: look where Claude Code installs itself
	engineScript: string; // the user's own patch for the delete engine; empty = built-in
	timeouts: {
		waitAfterDelete: number; // ms — pause between individual delete actions
		waitBetweenRetryDeleteAttempts: number;
		waitAfterDocumentLoad: number; // ms — pause after a page reload
	};
};
```

## Settings view

A form in the chrome UI at `/settings`. It calls `settings.get` on load and `settings.set`
on every change. The host pushes a `settingsChanged` event whenever settings change so
other views stay in sync.

Four cards — **Appearance, General, Assistant, Automation** — each with a `CardDescription`
saying what the group is for, and `SettingRow`s inside.

- **Appearance**: the mode switch (System / Light / Dark), the colour preset picker and the
  language picker. The language picker is a dropdown rather than a row of chips: twelve
  entries do not fit a row, and the same list hangs off the globe button in the header bar.
- **General**: which pages exist at all (X, YouTube, log, assistant, the overview's info
  panel), plus notifications and diagnostics. Hiding a platform only takes it out of the
  sidebar and the overview — its webview stays loaded and signed in, so switching it back on
  costs nothing. **Keep me signed in** is the one switch here that only bites on the next
  launch: `clear_webview_session` in `src-tauri/src/lib.rs` deletes the WebView2 profile
  folder (`%LocalAppData%\com.thorstenalpers.cleanmyposts\EBWebView`) during `setup`, before
  the first webview exists. That moment is the point — it is the only one at which nothing
  holds the folder open, and `Webview::clear_all_browsing_data` was not usable instead
  because it completes asynchronously with no way to wait, so the site webviews would race it.
- **Assistant**: the source choice — the local binary with its path field, or a hosted
  provider with a button into the API-keys dialog.
- **Automation**: everything that decides how a run behaves — the confirmation, the cookie
  banners, the three waits, and the engine script.

`notifications` and `telemetry` are two switches that could be mistaken for each other and
are not. A toast is a courtesy; the log is the record, and the diagnostics switch is enforced
in `bridge::log` rather than in the view, because a buffer the UI merely refuses to draw
would still be a record of the run. **There is no telemetry in this app** — nothing is sent
anywhere, and the switch says so rather than pretending to govern a network call.

The overview's info panel also carries its own tick box, so dismissing it never needs a trip
to the settings — but turning it back on does, which is why the switch exists at all.

What used to be the About card is now its own page, `/info`.

## Colour presets

`themePreset` names a class on `<html>` (`theme-claude`, `theme-cosmic`, …) defined in
`src/themes.css`; `Default` is the absence of one. A preset overrides only the
accent-carrying tokens — `--primary`, `--ring` and the accent pair — so it changes the app's
colour identity without touching the neutral backgrounds, cards and borders that carry its
contrast. `--destructive` is deliberately not overridable: red means deletion.

Every theme change goes through `applyThemeChange` in `$lib/theme/preset.ts`, which
suppresses transitions across the swap. That is not cosmetic — Chromium otherwise keeps the
old colour on elements whose `transition` covers a property fed by a custom variable that
changed on an ancestor. The suppressor is removed by rAF **and** a 100 ms timer, because
this app parks webviews off-screen where frames stop and rAF never fires; without the timer
the suppressor would survive and kill every transition in the app. `mode-watcher`'s own
suppressor is turned off (`disableTransitions={false}`) for exactly that reason.

Theme and preset apply to the web UI only. The window keeps the system title bar, and the
host does not restyle it.

## Timeout defaults

The defaults are conservative by design. Raising them further is always safe; lowering them
risks triggering platform automation detection.

| Setting                          | Default  | Notes                                    |
| -------------------------------- | -------- | ---------------------------------------- |
| `waitAfterDelete`                | 500 ms   | Pause after each individual deletion     |
| `waitBetweenRetryDeleteAttempts` | 500 ms   | Pause between retries within a page load |
| `waitAfterDocumentLoad`          | 3 000 ms | Pause after a page reload before running |
