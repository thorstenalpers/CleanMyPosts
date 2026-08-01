# Documentation

The working basis for humans and agents. Entry point is [AGENTS.md](../../AGENTS.md) in the
repo root — hard rules there, details here. All docs are written in English.

## Layout

| File                                                          | Content                                       |
|---------------------------------------------------------------|-----------------------------------------------|
| [00-product-vision.md](00-product-vision.md)                  | What the app is, features, non-goals          |
| [01-architecture.md](01-architecture.md)                      | Projects, two WebViews, orchestrator          |
| [02-bridge-contract.md](02-bridge-contract.md)                | Chrome bridge + content protocol              |
| [04-content-script.md](04-content-script.md)                  | Delete engine, selectors, robustness          |
| [06-navigation-and-views.md](06-navigation-and-views.md)      | Sidebar, routes, view structure               |
| [08-feature-delete.md](08-feature-delete.md)                  | Delete flow, URL map, retry loop              |
| [09-feature-settings.md](09-feature-settings.md)              | Settings fields, persistence, defaults        |
| [10-design-system.md](10-design-system.md)                    | Colors, typography, tokens, motion            |
| [11-frontend-conventions.md](11-frontend-conventions.md)      | Svelte 5 rules, build targets, layers         |
| [12-testing-and-quality.md](12-testing-and-quality.md)        | Test pyramid, CI, logging                     |
| [13-security-and-privacy.md](13-security-and-privacy.md)      | Threat model, data handling                   |
| [14-roadmap.md](14-roadmap.md)                                | Phases with acceptance criteria               |
| [adr/](adr/)                                                  | Decisions worth their own record              |

## Rules for these files

- One file = one topic. If one grows past ~250 lines, split it.
- What lives in the code does not live here. No copied signatures, no file lists that go
  stale on the first refactor.
- External facts (DOM selectors, dates) get a checked-on date. Without a date they are
  worthless.
