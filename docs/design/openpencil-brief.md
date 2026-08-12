# デザイン原本をOpenPencilで作る

`docs/design/mock.html` の見た目が承認された。これを OpenPencil のデザインデータとして起こす。

**新しくデザインしない。既にあるものを再現するのが仕事。**

## 手順1: モックの修正

`docs/design/mock.html` の左上にある「VCT 2026」の表示を削除する。他は変えない。

## 手順2: OpenPencilで原本を作る

修正後の `mock.html` を正本として、`docs/design/` に次を置く。

1. `probability-board.fig` — モバイル（幅375）とデスクトップ（幅1280）の2フレーム
2. `probability-board-mobile.png`
3. `probability-board-desktop.png`

`mock.html` から読み取るもの: 配色、書体サイズと太さ、余白、罫線、8列の表構造（チーム／Playoff／1位〜6位）、ヘッダー1行、Alpha/Omegaのタブ、確率ゼロの打消し線。データも `mock.html` の中にある。

タブは選択状態のスナップショットでよい（Alphaを選択した状態）。

## 実行方法

**必ず PATH 上の `openpencil` を使う**（`/home/hal/.local/bin/openpencil`）。`node_modules/.bin/openpencil` を直接実行しない。ラッパーが Node.js 互換シム（`~/.config/ai/openpencil-node-compat.mjs`）を読み込んでおり、迂回すると `Bun is not defined` で落ちる。

空の `.fig` を作るコマンドはないが、`.pen` から変換できる。`.pen` は読み取り専用、`.fig` が読み書き可能。

```sh
printf '%s' '{"version":"1","children":[]}' > /tmp/blank.pen
openpencil convert /tmp/blank.pen -o docs/design/probability-board.fig
openpencil eval docs/design/probability-board.fig -c '<JavaScript>' -w
openpencil export docs/design/probability-board.fig -f png -o <出力> --node <nodeId>
```

`eval` は Figma Plugin API で動く。`figma.createFrame()` `createText()` `createRectangle()` `createLine()` `appendChild` `resize` `fills` `strokes` などが使える想定。テキストの前に `figma.loadFontAsync` が要る場合がある。

**使えるAPIは環境依存なので、まず小さく試して確かめること。**フレーム1つ→矩形1つ→テキスト1つ、と段階的に確認してから本番を組む。構造の確認には `openpencil tree` `pages` `find` `node` を使う。

書体はOpenPencilが扱えるものから、`mock.html` のシステムスタックに近いものを選ぶ。**選んだ書体名と理由を報告すること。**日本語が出せない場合、ローマ字や英語に置き換えず、出せなかった事実を報告する。

## 守ること

- デザインを変えない。改善案があっても実装せず報告に書くだけ
- `docs/design/` と `mock.html` 以外を触らない
- コミットしない（`.git` は書き込み不可にしてある）
- 中間ファイルは `/tmp` に置き、リポジトリへ残さない

## 報告

- 実際に動いたコマンド列（そのまま再現できる形で）
- 使えたAPIと使えなかったAPI
- 選んだ書体と理由
- 再現できなかった要素とその理由
- PNGが `mock.html` にどれくらい近いかの自己評価

**再現できない点があっても、できたところまでを残して報告すること。**全部できないと分かった時点で何も残さず終わる、という進め方はしない。
