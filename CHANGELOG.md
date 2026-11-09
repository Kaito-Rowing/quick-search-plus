# Changelog

## 1.2.1 — 2026-11-09

### Fixed
- Isolate the selection UI in Shadow DOM and keep the host transparent, preventing page styles from adding square backgrounds or borders.
- Recheck the current selection at activation time; never navigate to a changed URL that the displayed Open action did not represent.
- Preserve selected whitespace when copying, try the legacy copy fallback on API rejection as well as unavailability, and restore the selection after fallback.
- Ignore stale clipboard completions after dismissal or reselection.
- Replace unsupported SVG manifest icons with PNGs; add a plus mark to distinguish the sibling extension.
- Validate thresholds consistently, reject partial numbers and handle settings load/save failures.

### Added
- Keyboard selection and Tab / Enter / Space actions, Escape dismissal and forced-colors styles.
- Japanese and English interface messages, a refreshed options page and reset-to-defaults form action.
- Measured action/count grouping to avoid overlaps and keep the full group within the viewport.
- Unit and real-extension browser tests, CI, runtime-only packaging and release documentation.
- Separate English and Japanese READMEs, actual extension screenshots and privacy policies.

### Changed
- Limit page matching to HTTP/HTTPS main frames. Exclude forms and editable content from selection tools.
- Count the exact selection (including whitespace) as grapheme clusters; only compute counts when enabled.
- Apply saved preferences to already-open pages; protect initial loading from racing newer storage changes.
- Require Chrome 123 or later for the UI features used.

## 1.2.0

- Existing selection tools: Google Search, direct URL opening, copy and optional character counts with synced preferences.
