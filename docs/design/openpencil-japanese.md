# OpenPencil CLIで日本語をPNGへ書き出す

## 結論

OpenPencil CLI 0.13.2のヘッドレス書き出しでは、OSにインストールされた日本語フォントを列挙・読込できない。さらにCJKフォールバックの非同期読込を待たずに最初の画像を描画する。このため、CJKを含むテキストノードはフォールバックが空の間は描画対象から除外され、文字化けではなくノード全体が消える。

CLI起動前に`@open-pencil/core`の`fontManager`へ単体TTFを登録し、CJKフォールバックとして設定すれば、日本語を編集可能な`TEXT`ノードのままPNGへ書き出せる。

このリポジトリの成果物は、既にインストールされていたIPAexゴシックをフォールバックに使って再生成した。依存関係は追加していない。

## 切り分け結果

対象環境はOpenPencil CLI 0.13.2、Node.jsラッパー起動である。

- `FigmaAPI.loadFontAsync()`は空のasync関数で、指定を検証せず何もしない。`Inter Regular`、`Noto Sans CJK JP Regular`、存在しない`No Such Font Impossible`がすべて成功扱いになった。
- `FigmaAPI.listAvailableFontsAsync()`は常に`[]`を返す。CLIで利用可能フォントを調べるAPIにはなっていない。
- 実際のPNG描画は`FontManager`を使う。Node環境では`findLocalFont()`が即座に`null`を返すため、`fc-list`に見えるフォントは自動では利用されない。
- CJKを含むテキストは、CJKフォールバックが1件も登録されていないと`hasRequiredFallbackFonts()`がfalseになり、`buildTextPicture()`が`null`を返す。このガードが「日本語を含むノードが丸ごと消える」直接原因である。
- ヘッドレスの`renderer.loadFonts()`は`ensureCJKFallback()`を開始するがawaitしない。直後の書き出し準備は文書で明示された主フォントだけを待つため、リモートCJKフォントが取得可能でも初回PNGに間に合う保証がない。
- 同梱Interの解決は`import.meta.resolve("@open-pencil/core/package.json")`を使うが、0.13.2の`package.json`の`exports`に`./package.json`がない。このためNodeでは`ERR_PACKAGE_PATH_NOT_EXPORTED`になる。
- `/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc`をそのままCanvasKitへ登録しても、この環境では日本語が描画されなかった。単体TTFのIPAexゴシックとDroid Sans Fallbackでは描画できた。

400×160の最小FIGに英字と日本語を別ノードで置き、PNGの各領域の平均輝度を測った。白一色は`1`である。

| 条件 | 英字領域 | 日本語領域 | 判定 |
| --- | ---: | ---: | --- |
| 通常の0.13.2 | 1 | 1 | Inter解決失敗で両方消失 |
| 同梱InterとIPAexゴシックを事前登録 | 0.931431 | 0.947836 | 両方描画 |

英数字が以前描画できていたのは、一時ローダーが`./package.json`の非公開subpath解決を回避してInterを利用可能にしていたためである。その回避だけではCJKフォールバックは登録されない。

## 必要な恒久設定

`~/.local/share/ai-tools/`以下は変更しない。chezmoi側の`~/.config/ai/openpencil-node-compat.mjs`へ、既存のBun互換処理に加えて次の事前登録を入れる。

```js
import { readFile, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";

const homePath = process.env.HOME;
const corePath = `${homePath}/.local/share/ai-tools/node_modules/@open-pencil/core`;
const { fontManager } = await import(
  pathToFileURL(`${corePath}/dist/text/fonts.js`).href
);

for (const [style, filename] of [
  ["Regular", "Inter-Regular.ttf"],
  ["Medium", "Inter-Medium.ttf"],
  ["SemiBold", "Inter-SemiBold.ttf"],
  ["Bold", "Inter-Bold.ttf"],
  ["ExtraBold", "Inter-ExtraBold.ttf"],
]) {
  const data = await readFile(`${corePath}/assets/${filename}`);
  fontManager.markLoaded(
    "Inter",
    style,
    data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  );
}

const arabic = await readFile(`${corePath}/assets/NotoNaskhArabic-Regular.ttf`);
fontManager.markLoaded(
  "Noto Naskh Arabic",
  "Regular",
  arabic.buffer.slice(
    arabic.byteOffset,
    arabic.byteOffset + arabic.byteLength,
  ),
);

const cjkPath =
  process.env.OPENPENCIL_CJK_FONT ??
  "/usr/share/fonts/opentype/ipaexfont-gothic/ipaexg.ttf";
const cjk = await readFile(cjkPath);
const cjkData = cjk.buffer.slice(
  cjk.byteOffset,
  cjk.byteOffset + cjk.byteLength,
);
const cjkFamily = "OpenPencil CJK Fallback";
fontManager.markLoaded(cjkFamily, "Regular", cjkData);
fontManager.setCJKFallbackFamily(cjkFamily);
```

既存ファイル冒頭の`readFile, writeFile` importは重複させず、`pathToFileURL`だけを追加する。既存の`globalThis.Bun = { file, write }`は残す。

この事前登録は次の2点を同時に解決する。

1. 同梱Interを既知の実体パスから読み、問題の`@open-pencil/core/package.json`解決を通らない。
2. PNGレンダラー生成前にCJKフォールバックを確定し、非同期ロード競合を通らない。

IPAexゴシックが別の場所にある環境では、ラッパーから`OPENPENCIL_CJK_FONT`へ単体の`.ttf`または`.otf`を指定する。TTCはこの環境では利用できなかった。

## 書き出し

起動は必ずPATH上のラッパーを使う。互換ファイルへ上記設定を反映した後は追加オプション不要である。

```sh
openpencil export docs/design/probability-board.fig \
  --node '0:4' \
  -o docs/design/probability-board-mobile.png

openpencil export docs/design/probability-board.fig \
  --node '0:125' \
  -o docs/design/probability-board-desktop.png
```

現在のFIGには画像フィルが0件、日本語を含む`TEXT`ノードが20件あり、20件すべて`opacity > 0`である。旧回避レイヤーと未参照画像blobも削除済みで、FIGアーカイブは`canvas.fig`、`thumbnail.png`、`meta.json`の3ファイルだけになっている。

確認には次を使う。

```sh
openpencil eval docs/design/probability-board.fig --json -c '
const all = figma.currentPage.findAll();
const images = all.filter(
  (n) => Array.isArray(n.fills) && n.fills.some((f) => f.type === "IMAGE"),
);
const japanese = all.filter(
  (n) => n.type === "TEXT" && /[ぁ-んァ-ヶ一-龠]/u.test(n.characters),
);
return {
  imageLayers: images.length,
  japaneseTexts: japanese.length,
  visibleJapaneseTexts: japanese.filter((n) => n.opacity > 0).length,
};'
```

期待値は`imageLayers: 0`、`japaneseTexts: 20`、`visibleJapaneseTexts: 20`である。

FIGを組み直す場合は、複数回の`eval -w`へ分けず、ノード作成・変更を1回の`eval`で完了させて保存する。0.13.2では段階保存後の再読込で既存ノード構造が保持されないケースがある。

## 上流での修正候補

ローカルpreloadを不要にするには、OpenPencil側で少なくとも次が必要である。

- `@open-pencil/core`の公開`exports`に`./package.json`を追加するか、`fetchBundledFont()`が非公開subpathを解決しない実装へ変える。
- Node向けに明示的なフォントファイル登録APIを公開する。
- ヘッドレス書き出しでは`ensureCJKFallback()`と`ensureArabicFallback()`の完了後に描画する。
- `loadFontAsync()`を実際の`FontManager.loadFont()`へ接続し、失敗をrejectする。
- CLI向け`listAvailableFontsAsync()`が同梱・事前登録済みフォントを返すようにする。

OpenPencil v0.14.0は調査時点の最新リリースだが、このリポジトリでは依存更新を行っておらず、同じ最小再現を未検証である。更新する場合も上記の赤／緑判定を先に通す。
