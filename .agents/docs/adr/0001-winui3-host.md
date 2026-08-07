# ADR 0001 — WinUI 3 instead of WPF for the host

- **Status:** Superseded by [0002](0002-tauri-host.md)
- **Date:** 2026-07-31
- **Supersedes:** the WPF host that shipped up to v2.1.4

## Context

The host exists to do three things: own a window, host two WebView2 controls, and pass JSON
between the Svelte UI and C#. It had no XAML styling, no MVVM, no bindings, no converters,
and no animations — the entire WPF surface was about ten files.

WPF still works, but it is in maintenance mode. WinUI 3 is where the WebView2 control,
Mica/backdrop material, the modern title bar, and per-monitor DPI handling are actually
being developed. Because the WPF coupling was so thin, the cost of moving was small and
unlikely to get smaller later.

## Decision

Migrate the host to WinUI 3 (Windows App SDK 2.3), in place in `CleanMyPosts.csproj`,
**unpackaged** and self-contained.

Supporting decisions taken with it:

- **Unpackaged, not MSIX.** MSIX would break AutoUpdater.NET (packaged apps do not update
  themselves by running an installer) and would force a signing certificate into the
  release pipeline. The Inno Setup installer and the existing update feed stay untouched.
- **No `PublishSingleFile`.** WinUI 3 self-contained plus single-file is not supported by
  Microsoft; the native XAML/WinRT libraries do not survive it. The installer bundles the
  folder instead, which the user never sees anyway.
- **Own update dialog.** AutoUpdater.NET's built-in prompt is a WinForms form. Replacing it
  with a `ContentDialog` drops the WinForms dependency entirely.
- **Web assets as embedded resources.** With no folder to map, `SetVirtualHostNameToFolderMapping`
  is replaced by `WebResourceRequested` served from the assembly. The publish folder loses
  its `wwwroot/` and `Scripts/` trees.
- **`System.Text.Json` everywhere.** The bridge already used it; `FileService` was the last
  `Newtonsoft.Json` consumer, so the dependency is gone.

## Consequences

**Good**

- Mica backdrop, extended title bar, and WinUI theme resources come for free; the startup
  skeleton is styled from `ThemeResource` and follows light/dark without extra code.
- `AppWindow` gives real multi-monitor-aware bounds restore, which the WPF code only
  pretended to do (its "centre if off-screen" branch was unreachable).
- Nothing is written next to the executable any more (`AppPaths` + `WEBVIEW2_USER_DATA_FOLDER`).
- The host builds with nullable reference types on and zero warnings.

**Bad / accepted**

- Minimum OS rises to Windows 10 build 19041 (version 2004, May 2020). WPF would have run
  on older builds.
- The self-contained Windows App SDK adds roughly 100 MB of localisation and runtime files
  to the publish folder. Acceptable for an installer-delivered desktop app.
- Two Win32 P/Invokes are needed: `MessageBoxW` for start-up failures that happen before a
  `XamlRoot` exists, and `LoadIcon` to reuse the icon already compiled into the executable.
  `AllowUnsafeBlocks` is enabled for the `LibraryImport` source generator.
- `WindowSettings.json` changed from doubles to ints and from a numeric enum to a string.
  `FileService.Read` now swallows `JsonException` and falls back to defaults, so a file
  written by an older version cannot block start-up.

## Alternatives considered

- **Stay on WPF.** Cheapest, but keeps the app on a framework that will not gain WebView2 or
  Windows 11 shell features.
- **New WinUI project plus a platform-neutral core library.** Cleaner layering, but the
  host has almost no logic to extract — the split would have been ceremony.
- **Avalonia / Uno.** Cross-platform is not a goal; the app is inherently a Windows
  WebView2 tool.
