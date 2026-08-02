# Architecture Decision Records

One file per decision that was expensive to make and would be expensive to reverse. Not a
changelog: if a decision is obvious from the code, it does not belong here.

Format: context → decision → consequences (good *and* bad) → alternatives considered.
Records are immutable. A decision that no longer holds gets a new ADR that supersedes it;
the old one keeps its number and gains a `Superseded by` line.

| ADR                                        | Decision                                  | Status   |
|--------------------------------------------|-------------------------------------------|----------|
| [0001](0001-winui3-host.md)                | WinUI 3 instead of WPF for the host        | Superseded by 0002 |
| [0002](0002-tauri-host.md)                 | Tauri 2 instead of .NET for the host       | Accepted |
