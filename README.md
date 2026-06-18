# Quick Google Search

選択したテキストの近くに検索アイコンを表示し、クリックするとGoogle検索を開くChrome拡張機能です。

## 機能

- Webページ上でテキストを選択すると検索アイコンを表示します。
- アイコンをクリックすると、選択したテキストでGoogle検索を新しいタブに開きます。
- 拡張機能の権限は追加していません。
- 選択テキストは保存せず、クリックした時だけGoogle検索URLに渡します。

## インストール方法

1. このリポジトリをダウンロード、またはcloneします。
2. Chromeで `chrome://extensions/` を開きます。
3. 右上の「デベロッパー モード」を有効にします。
4. 「パッケージ化されていない拡張機能を読み込む」をクリックします。
5. このリポジトリのフォルダを選択します。

## 権限とセキュリティ

- `permissions` は空配列です。
- `content_scripts.matches` は `<all_urls>` です。これは、任意のページでテキスト選択を検出して検索アイコンを表示するために必要です。
- 外部通信は、ユーザーが検索アイコンをクリックした時にGoogle検索ページを新しいタブで開く動作だけです。
- `eval`、動的スクリプト実行、ストレージ保存、外部API通信、リモートコード読み込みは使用していません。
- 検索タブは `noopener,noreferrer` 付きで開き、開いたページから元ページを参照できないようにしています。

## 開発

この拡張機能はビルド手順なしで動作します。ファイルを編集した後は、`chrome://extensions/` で拡張機能を再読み込みしてください。

主要ファイル:

- `manifest.json`: Chrome拡張機能の定義
- `content.js`: 選択テキストの検出と検索アイコンの動作
- `styles.css`: 検索アイコンのスタイル
- `icons/`: 拡張機能アイコン

## English

Quick Google Search is a Chrome extension that shows a search icon near selected text and opens a Google search for that text when clicked.

### Features

- Shows a search icon when text is selected on a web page.
- Opens a Google search for the selected text in a new tab.
- Uses no extension permissions.
- Does not store selected text. The text is only sent as part of the Google search URL after the user clicks the icon.

### Installation

1. Download or clone this repository.
2. Open `chrome://extensions/` in Chrome.
3. Enable "Developer mode".
4. Click "Load unpacked".
5. Select this repository folder.

### Permissions and Security

- `permissions` is an empty array.
- `content_scripts.matches` uses `<all_urls>` so the extension can detect selected text and show the search icon on any page.
- The only external navigation happens when the user clicks the search icon, which opens Google Search in a new tab.
- The extension does not use `eval`, dynamic script execution, local storage, external API calls, or remote code loading.
- Search tabs are opened with `noopener,noreferrer` so the opened page cannot reference the original page.

### Development

No build step is required. After editing files, reload the extension from `chrome://extensions/`.

## License

MIT
