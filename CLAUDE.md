# CLAUDE.md

CleanMyPosts is a **.NET 10 WPF Windows desktop app** that bulk-deletes posts,
reposts, replies, likes and followings on X (Twitter) and comments/likes on
YouTube, by driving an embedded WebView2 browser with injected JavaScript.

## Layout

```
CleanMyPosts.slnx                       # solution (repo root)
src/CleanMyPosts/CleanMyPosts.csproj    # WPF app (WebView2 + MahApps.Metro + CommunityToolkit.Mvvm)
  Scripts/                              # injected JS (delete-all-*.js)
  Services/  ViewModels/  Views/        # MVVM
src/Tests/Tests.csproj                  # xUnit tests (Xunit.StaFact for UI)
installer/Installer.iss                 # Inno Setup installer script
release-notes/vX.Y.Z.md                 # GitHub Release body per version
.github/workflows/ci.yml                # build + test on push/PR to main
.github/workflows/deploy-release.yml    # manual: installer, tag, GitHub Release, AutoUpdater feed
```

## Build & test

```bash
dotnet build CleanMyPosts.slnx -c Release
dotnet test src/Tests/Tests.csproj -c Release --filter "TestCategory!=Long-Running"
```

The filter mirrors CI, which excludes long-running tests.

## Branching

`main` is **protected** — direct pushes are blocked (including for admins) and
the `build` status check must pass. Every change ships through a PR against
`main`. Use `feature/<name>` for functionality, `fix/<name>` for bug fixes, and
`release/vX.Y.Z` for release prep.

## Versioning & release

- Version lives in `src/CleanMyPosts/CleanMyPosts.csproj` (`<Version>`).
- Do not bump `<Version>` without also adding `release-notes/v<version>.md` —
  that file becomes the GitHub Release body (`deploy-release.yml` reads it via
  `body_path`).
- **Do not create git tags manually.** `deploy-release.yml` creates the
  `v<version>` tag when it publishes.
- The long-lived **`update-feed`** branch holds the AutoUpdater.NET feed: at each
  release `deploy-release.yml` regenerates `update-installer.xml` from
  `update-template.xml` on it, and the installed app polls that file to detect
  new versions. It is a data-only branch — **do not delete it.** Deleting it
  breaks the in-app update check and the release workflow (which commits to it).
  If it is lost, recreate it from the last `Update for <version>` commit.
- The full release-prep flow (decide SemVer, branch, build/test, bump version,
  write release notes, open the PR to `main`) is encoded in the
  **`prepare-release`** skill at `.claude/skills/prepare-release/`. Run it via
  Claude Code (`/prepare-release`) when cutting a release; it prepares the PR
  only. Merging the PR and running **Deploy Release** (`workflow_dispatch`) are
  manual, admin-only steps.

## Code style

Global conventions in `~/.claude/CLAUDE.md` apply: comments only when the *why*
is non-obvious, `var` when the type is evident, expression-bodied members,
`is null` / `is not null`, `_camelCase` private fields, no `#region`.
