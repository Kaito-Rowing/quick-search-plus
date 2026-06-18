# Quick Search Plus

Quick Search Plus は [Quick Google Search](https://github.com/Kaito-Rowing/quick-google-search) の派生版です。
選択テキストをすばやく Google 検索する元の動作を保ちつつ、コピー、URL を開く、文字数表示の補助機能を追加しています。

## 機能

- Web ページ上でテキストを選択すると、近くに操作ボタンを表示します。
- 通常のテキストでは、クリックすると選択テキストで Google 検索を新しいタブで開きます。
- 選択テキストをクリップボードへコピーするボタンを表示します。
- `https://example.com`、`example.com/path`、`www.example.com` のような URL らしい文字列は、検索ではなく直接新しいタブで開けます。
- 選択テキストがしきい値以上の場合、小さな文字数バッジを表示します。
- コピー補助、URL を開く動作、文字数表示はオプションページからオン/オフできます。
- 文字数表示のしきい値も変更できます。初期値は 30 文字です。

## インストール

1. このリポジトリをダウンロードまたは clone します。
2. Chrome で `chrome://extensions/` を開きます。
3. 右上の「デベロッパー モード」を有効にします。
4. 「パッケージ化されていない拡張機能を読み込む」をクリックします。
5. このリポジトリのフォルダを選択します。

## オプション

拡張機能のオプションページで次の設定を変更できます。

- `Show copy button`: コピー補助ボタンの表示を切り替えます。
- `Open URL-like selections instead of searching`: URL らしい選択テキストを直接開くかどうかを切り替えます。
- `Show character count for longer selections`: 文字数バッジの表示を切り替えます。
- `Minimum characters`: 文字数バッジを表示する最小文字数を設定します。

初期設定:

- コピー補助ボタン: `true`
- URL らしい選択テキストを開く: `true`
- 文字数表示: `true`
- 最小文字数: `30`

## 権限とセキュリティ

- `storage` は、コピー、URL を開く動作、文字数表示の設定保存にだけ使います。
- `clipboardWrite` は、コピー補助ボタンをクリックした時に選択テキストをクリップボードへ書き込むためだけに使います。クリップボード読み取り権限は要求しません。
- `content_scripts.matches` は `<all_urls>` です。任意のページでテキスト選択を検出し、操作ボタンを表示するために必要です。
- 選択テキスト、閲覧履歴、ページ内容は保存しません。
- 選択テキストは、ユーザーが検索ボタンをクリックした時に Google 検索 URL に入るか、コピー補助ボタンをクリックした時にクリップボードへ書き込まれるか、URL を開くボタンをクリックした時に新しいタブで開かれるだけです。
- 検索タブと URL タブは `noopener,noreferrer` 付きで開き、開いたページから元ページを参照できないようにします。
- `eval`、動的スクリプト実行、外部 API 通信、リモートコード読み込みは使用しません。

## 開発

ビルド手順はありません。ファイルを編集した後は、`chrome://extensions/` で拡張機能を再読み込みしてください。

主なファイル:

- `manifest.json`: Chrome 拡張機能の定義。
- `content.js`: 選択テキストの検出、検索、URL を開く、コピー、文字数バッジの動作。
- `styles.css`: 選択時ツールバーと文字数バッジのスタイル。
- `options.html` / `options.js`: 選択時アクションの設定 UI。
- `icons/`: 拡張機能アイコン。

## English

Quick Search Plus is a fork of [Quick Google Search](https://github.com/Kaito-Rowing/quick-google-search).
It keeps the original selected-text Google search behavior and adds copy, URL-open, and optional character-count helpers.

### Features

- Shows action buttons near selected text on a web page.
- Opens a Google search for normal selected text in a new tab.
- Shows a copy button for selected text.
- Opens URL-like selections such as `https://example.com`, `example.com/path`, and `www.example.com` directly in a new tab.
- Shows a small character-count badge near the selection cursor when the selected text reaches the configured threshold.
- Lets you turn the copy button, URL-open behavior, and character-count badge on or off from the extension options page.
- Lets you change the character-count threshold. The default is 30 characters.

### Installation

1. Download or clone this repository.
2. Open `chrome://extensions/` in Chrome.
3. Enable "Developer mode".
4. Click "Load unpacked".
5. Select this repository folder.

### Options

Open the extension options page to configure:

- `Show copy button`: enables or disables the copy action.
- `Open URL-like selections instead of searching`: enables or disables URL detection.
- `Show character count for longer selections`: enables or disables the badge.
- `Minimum characters`: controls the threshold for showing the badge.

The default settings are:

- Copy button enabled: `true`
- URL-like selection opening enabled: `true`
- Character count enabled: `true`
- Minimum characters: `30`

### Permissions and Security

- `storage` is used only to save the options for copy, URL opening, and character-count display.
- `clipboardWrite` is used only to write selected text to the clipboard when you click the copy button. The extension does not request clipboard read permission.
- `content_scripts.matches` uses `<all_urls>` so the extension can detect selected text and show action buttons on any page.
- The extension does not store selected text, browsing history, or page content.
- The selected text is only placed into a Google Search URL after the user clicks the search button, copied after the user clicks the copy button, or opened as a URL after the user clicks the open-link button.
- Search and URL tabs are opened with `noopener,noreferrer` so the opened page cannot reference the original page.
- The extension does not use `eval`, dynamic script execution, external API calls, or remote code loading.

### Development

No build step is required. After editing files, reload the extension from `chrome://extensions/`.

Main files:

- `manifest.json`: Chrome extension definition.
- `content.js`: selected-text detection, search/open/copy behavior, and character-count badge behavior.
- `styles.css`: selection toolbar and character-count badge styles.
- `options.html` and `options.js`: settings UI for selection actions.
- `icons/`: extension icons.

## License

MIT
