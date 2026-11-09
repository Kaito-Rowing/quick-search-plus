# Contributing

Keep the selection tools small and predictable. No tracking, background content transmission, remote code or runtime dependencies. Search, direct navigation and clipboard writes must require explicit user actions.

## Setup

Use Node.js 24. Run `npm ci`, `npx playwright install chromium`, `npm run check`, `npm test` and `npm run package`. On Linux use `npx playwright install --with-deps chromium`. Load the repository at `chrome://extensions`; reload both the extension and test page after edits.

`shared.js` owns settings normalization, URL detection and grapheme counts. It is loaded before `content.js` and `options.js`. Keep the two consumers on the same defaults and validation rules. The content script uses a transparent custom-element host and Shadow DOM to isolate its controls from page CSS.

Browser tests launch the actual extension. They inspect its content-script world through CDP to find the real extension ID, open its options page, and inject specific clipboard failure/delay conditions. Normal storage, copy, search and navigation behavior uses the real extension APIs; browser destination requests are intercepted. Clipboard-read permission is granted only to test pages to verify writes; it is not in the extension manifest. Windows clipboard line-ending normalization is accounted for in assertions.

## Manual release checks

- Select with drag, double click, Shift + arrows and backwards/multiline selection. Test rapid reselection and immediate Tab activation.
- Search and open links with mouse, Enter and Space. Verify the tooltip names the destination and that a changed selection never unexpectedly opens an unseen URL.
- Copy on HTTPS and HTTP. Check selection preservation, actual clipboard content, Ctrl/Cmd fallback guidance on failure, and no stale success after reselection.
- Test Tab between actions, Escape from each button, screen-reader labels and high-contrast mode.
- Check narrow windows, each screen edge, browser zoom, dark pages, nested scrolling, tab switching and unusual site styles. The host should have no rectangular painted background.
- Verify combined emoji, combining accents, whitespace and inclusive count thresholds. Check disabled counts do not render a badge.
- Toggle all preferences, save/reload, and check an already-open page. Test invalid and disabled thresholds and reset-then-save semantics.
- Check Japanese and English UI, dark/light options, and a narrow options window.
- Confirm forms, password fields, editable regions, browser pages, PDFs, local files and frames are outside the documented support. Inspect extension errors.
- Test separately from Quick Google Search to avoid overlapping controls from two extensions.

## Assets, packaging and docs

The canonical vector source is `icons/icon128.svg`; run `npm run icons` to regenerate the 16/32/48/128 PNGs. The old 16/48 SVG files are historical source assets and are not shipped in the ZIP. Run `npm run demo` to refresh screenshots from the actual extension on a sample page; screenshots must not contain private browsing data.

`npm run package` uses an explicit allowlist for runtime assets, locales, license and privacy policy. Update it whenever adding a runtime file. Keep manifest, package and lockfile versions aligned. Update both READMEs for behavior changes, including copied whitespace, synced settings and supported URL forms.

Report bugs with Chrome version, OS, a public reproduction page if possible and reproduction steps. Remove personal information from screenshots and selected content.
