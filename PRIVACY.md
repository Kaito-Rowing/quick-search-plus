# Privacy policy

Effective date: November 9, 2026 · [日本語](docs/PRIVACY.ja.md)

Quick Search Plus is maintained by Kaito-Rowing. It provides search, copy, link opening and character counting for selected web text.

## Selection processing

The content script reads the current text selection and its position to show the selection controls, detect eligible links and count Unicode grapheme clusters. The selection is held temporarily in page memory, not saved in extension or website storage. References used by the controls are cleared on dismissal, selection clearing, scrolling, resizing, loss of focus or page departure. A pending clipboard operation may hold its text until the browser finishes that operation. Form fields and editable regions are excluded.

## User-directed actions

- **Search:** sends the trimmed selection as the `q` parameter of an HTTPS Google Search URL, only after explicit activation.
- **Open link:** opens a recognized HTTP/HTTPS URL from the selection, only after explicit activation. The destination receives a normal browser navigation request, which can include its query parameters.
- **Copy:** writes the exact selection to the operating system clipboard, only after explicit activation. The extension does not read the clipboard. OS clipboard history, clipboard sync and other applications may retain or access copied content under their own settings.
- **Count:** processes the selection locally without a network request.

Search and link tabs use `noopener,noreferrer`. Google, destination sites and your browser process searches and navigation under their own policies and settings, and may retain history. See [Google's Privacy Policy](https://policies.google.com/privacy). Manage those records through browser, site, account and OS controls; this extension cannot erase them.

## Saved preferences and permissions

The only data the extension persists is four preferences: copy enabled, direct-link opening enabled, count enabled and the count threshold. They are saved using `chrome.storage.sync`. Chrome may synchronize those preferences through your browser account when browser sync is enabled; selected text is never written to that storage. Disable Chrome Sync to control browser-account synchronization. Extension preferences can be reset through Options, followed by Save; disable or uninstall the extension at `chrome://extensions`.

`storage` is used for preferences. `clipboardWrite` is used for explicit copy actions; no clipboard-read permission is requested. The content script declares HTTP/HTTPS page access to detect selections and show controls. Site access can be restricted through Chrome's extension settings.

There is no analytics, advertising, developer-operated server, sale of user data, background content transmission or remote executable code. The developer does not maintain a user-data database.

## Contact and changes

Contact the maintainer via [GitHub Issues](https://github.com/Kaito-Rowing/quick-search-plus/issues); do not post sensitive content. Changes to data handling will be documented here and in the changelog before release.
