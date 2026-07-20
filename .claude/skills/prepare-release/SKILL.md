---
name: prepare-release
description: Prepare a new release of CleanMyPosts (version bump, release notes, release PR to main). Use this whenever the user mentions releasing, publishing, shipping, cutting a release, bumping the version, or preparing release notes — even if they don't say "release" explicitly. Decides the next SemVer version automatically and proceeds when there are new commits since the last tag.
---

# Prepare release

Prepare a new release of the CleanMyPosts desktop app. You decide the next
version yourself. You **prepare the repository and open the release PR — then
stop.** Reviewing, merging, and publishing are **admin-only** and not part of
your job:

- You do **not** merge the release PR (or enable auto-merge). The admin reviews
  and merges every PR manually. `main` is a protected branch — direct pushes are
  blocked, so every change ships through a PR.
- You do **not** trigger `deploy-release.yml`. The GitHub Release (installer
  build, `v<version>` git tag, AutoUpdater feed) is a manual `workflow_dispatch`
  the admin runs **after** merging the release PR.

## Workflow

1. **Check whether there is anything to release**
   - Run the helper: `bash .claude/skills/prepare-release/scripts/check-updates.sh`
   - Exit code **3** = nothing to release (no new commits since the last tag) → **stop**.
   - Exit code **0** = new commits exist → continue.

2. **Determine current version & last tag**
   - Read `<Version>` in `src/CleanMyPosts/CleanMyPosts.csproj`.
   - Latest tag: `git tag --sort=-v:refname | head -1`.

3. **Decide the next version (SemVer)** from `git log --oneline <tag>..HEAD`:
   - **MAJOR** breaking / behavior-removing changes · **MINOR** new features ·
     **PATCH** fixes/docs/dependency bumps.
   - Must be strictly greater than the current version. State it + a one-line reason.

4. **Confirm clean tree** — `git status --short`; if dirty, ask how to proceed.

5. **Branch from up-to-date `main`** — `git checkout main && git pull` then
   `git checkout -b release/v<version>`. Release branches always cut from `main`.

6. **Build & test (green required)**
   - `dotnet build CleanMyPosts.slnx -c Release`
   - `dotnet test src/Tests/Tests.csproj -c Release --filter "TestCategory!=Long-Running"`
     (same filter CI uses; long-running tests are excluded).

7. **Bump `<Version>`** in `src/CleanMyPosts/CleanMyPosts.csproj`.

8. **Extend docs** — update `README.md` etc. if the changes warrant it.

9. **Release notes** — copy `.claude/skills/prepare-release/assets/release-notes.md`
   to `release-notes/v<version>.md` and fill in the `### What's Changed` bullets
   with **user-facing** notes (not raw commit subjects). This file becomes the
   GitHub Release body verbatim — `deploy-release.yml` reads it via `body_path`.

10. **Commit** (no tag) — stage the csproj, docs, and release notes; message
    `release: v<version>`. Do **not** create a git tag — `deploy-release.yml`
    creates `v<version>` at publish time.

11. **Push & open PR to main — then stop. Do NOT merge it.**
    - `git push -u origin release/v<version>`
    - `gh pr create --base main --head release/v<version> --title "release: v<version>" --body <notes>`
    - The admin reviews and merges the PR. You never merge it or enable auto-merge.

12. **Report** the PR link and remind the admin: after **they** merge it, **they**
    trigger **Deploy Release** manually (Actions → Deploy Release → Run workflow).
    That workflow builds the installer, tags `v<version>`, publishes the GitHub
    Release from `release-notes/v<version>.md`, and updates the AutoUpdater feed.
    You do not trigger it.
