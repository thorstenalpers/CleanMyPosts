# Feature: Settings

## Persistence

All settings live in one file, `settings.json` under Tauri's `app_config_dir`
(`%AppData%\com.thorstenalpers.cleanmyposts\`), owned by `SettingsStore`
(`src-tauri/src/settings.rs`). Window position and size are not persisted.

It is read once on start-up and written immediately on every change. The enum is stored as
its name, not a number, so the file stays readable.

`SettingsStore::load` falls back to defaults when the file is missing or cannot be parsed.
Settings are user state, not a contract — a file left behind by an older version must never
block start-up. That is the migration story; there is no version field and no migration code.

**Known gap:** `accentColor` and `useSystemAccent` are in the Zod schema below but not in the
Rust `AppSettings`, so `settings.get` currently fails the UI's validation. Tracked in
[14-roadmap.md](14-roadmap.md).

## Settings fields

```ts
type AppSettings = {
  theme: 'Default' | 'Light' | 'Dark';
  showLogs: boolean;
  confirmDeletion: boolean;
  accentColor: string;       // '#RRGGBB'
  useSystemAccent: boolean;
  timeouts: {
    waitAfterDelete: number;              // ms — pause between individual delete actions
    waitBetweenRetryDeleteAttempts: number;
    waitAfterDocumentLoad: number;        // ms — pause after a page reload
  };
};
```

## Settings view

A form in the chrome UI. It calls `settings.get` on load and `settings.set` on every change.
The host pushes a `settingsChanged` event whenever settings change so other views stay in
sync.

The Appearance section holds the theme switch (System / Light / Dark), the
`AccentPicker` component (eight presets plus a hex field), and the "use Windows accent
colour" toggle.

## Accent colour

`useSystemAccent` is on by default. While it is on, `settings.get` returns the **resolved**
Windows accent colour (`UISettings.GetColorValue(UIColorType.Accent)`) as `accentColor`, and
`settings.set` deliberately ignores the incoming `accentColor` — otherwise the resolved
system colour would overwrite the user's own pick the first time anything else is saved.

On the UI side `$lib/theme/accent.ts` converts the hex value to OKLCH and writes
`--accent-base`, `--accent-base-hover`, and `--accent-on` onto the document root; `app.css`
derives `--primary` and `--ring` from them. See [10-design-system.md](10-design-system.md).

Theme and accent apply to the web UI only. The window keeps the system title bar, and the
host does not restyle it.

## Timeout defaults

The defaults are conservative by design. Raising them further is always safe; lowering them
risks triggering platform automation detection.

| Setting                          | Default  | Notes                                      |
|----------------------------------|----------|--------------------------------------------|
| `waitAfterDelete`                | 500 ms   | Pause after each individual deletion       |
| `waitBetweenRetryDeleteAttempts` | 500 ms   | Pause between retries within a page load   |
| `waitAfterDocumentLoad`          | 3 000 ms | Pause after a page reload before running   |
