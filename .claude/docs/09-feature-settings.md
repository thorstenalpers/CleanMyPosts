# Feature: Settings

## Persistence

Settings are stored as JSON in the user's `%AppData%\CleanMyPosts\settings.json` via
`UserSettingsService`. They are loaded on startup and written immediately on every change.
The schema is flat; no migrations are needed unless a key is renamed or removed.

## Settings fields

```ts
type AppSettings = {
  theme: 'Default' | 'Light' | 'Dark';
  showLogs: boolean;
  confirmDeletion: boolean;
  timeouts: {
    waitAfterDelete: number;              // ms — pause between individual delete actions
    waitBetweenRetryDeleteAttempts: number;
    waitAfterDocumentLoad: number;        // ms — pause after a page reload
  };
};
```

## Settings view

The settings view is a form in the chrome UI. It calls `settings.get` on load and
`settings.set` on every change. The host pushes a `settingsChanged` event whenever
settings change so that other views (e.g. timeout display) stay in sync.

## Timeout defaults

The defaults are conservative by design. Raising them further is always safe; lowering
them risks triggering platform automation detection. The defaults should be documented
in the UI tooltip for each slider.

| Setting                          | Default  | Notes                                      |
|----------------------------------|----------|--------------------------------------------|
| `waitAfterDelete`                | 1 000 ms | Pause after each individual deletion       |
| `waitBetweenRetryDeleteAttempts` | 1 000 ms | Pause between retries within a page load   |
| `waitAfterDocumentLoad`          | 2 000 ms | Pause after a page reload before running   |
