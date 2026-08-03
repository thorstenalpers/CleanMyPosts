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
	language: 'System' | 'en' | 'de'; // System follows the language Windows runs in
	showIntro: boolean; // the explainer card on the overview
	showLogs: boolean;
	showX: boolean; // whether the sidebar offers the platform at all
	showYouTube: boolean;
	confirmDeletion: boolean;
	themePreset: 'Default' | 'Claude' | 'Cosmic' | 'Supabase' | 'Graphite';
	showAssistant: boolean;
	assistantSource: string; // 'claude-code' for the local binary, else a provider id
	assistantCliPath: string; // empty: look where Claude Code installs itself
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

Six cards — Appearance, Navigation, Assistant, Safety, Timing, About — each with a
`CardDescription` saying what the group is for, and `SettingRow`s inside. Appearance holds the
mode switch (System / Light / Dark), the colour preset picker and the language picker.
Navigation holds the five visibility switches: X, YouTube, the overview's introduction card,
the log and the assistant. Assistant holds the source choice — the local binary with its path
field, or a hosted provider with a button into the API-keys dialog. The introduction also
carries its own tick box, so dismissing it never needs a trip to the settings — but turning
it back on does, which is why the switch exists at all. Hiding a platform only takes it out of the sidebar and the
overview — its webview stays loaded and signed in, so switching it back on costs nothing.

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
