# Quick Search Plus

Quick Search Plus is a fork of [Quick Google Search](https://github.com/Kaito-Rowing/quick-google-search).
It keeps the original selected-text Google search behavior and adds an optional character-count badge for longer selections.

## Features

- Shows a search icon when text is selected on a web page.
- Opens a Google search for the selected text in a new tab when the icon is clicked.
- Shows a small character-count badge near the selection cursor when the selected text reaches the configured threshold.
- Lets you turn the character-count badge on or off from the extension options page.
- Lets you change the character-count threshold. The default is 30 characters.

## Installation

1. Download or clone this repository.
2. Open `chrome://extensions/` in Chrome.
3. Enable "Developer mode".
4. Click "Load unpacked".
5. Select this repository folder.

## Options

Open the extension options page to configure:

- `Show character count for longer selections`: enables or disables the badge.
- `Minimum characters`: controls the threshold for showing the badge.

The default settings are:

- Character count enabled: `true`
- Minimum characters: `30`

## Permissions and Security

- `storage` is used only to save the character-count setting and threshold.
- `content_scripts.matches` uses `<all_urls>` so the extension can detect selected text and show the search icon on any page.
- The extension does not store selected text, browsing history, or page content.
- The selected text is only placed into a Google Search URL after the user clicks the search icon.
- Search tabs are opened with `noopener,noreferrer` so the opened page cannot reference the original page.
- The extension does not use `eval`, dynamic script execution, external API calls, or remote code loading.

## Development

No build step is required. After editing files, reload the extension from `chrome://extensions/`.

Main files:

- `manifest.json`: Chrome extension definition.
- `content.js`: selected-text detection, search icon behavior, and character-count badge behavior.
- `styles.css`: search icon and character-count badge styles.
- `options.html` and `options.js`: settings UI for the character-count badge.
- `icons/`: extension icons.

## License

MIT
