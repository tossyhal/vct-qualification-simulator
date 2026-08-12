# OpenPencilで日本語を描画できるようにする

## 現状

`docs/design/probability-board.fig` を OpenPencil CLI で作り、PNGへ書き出した。英数字は正しく描画されるが、**日本語を含むテキストノードはPNGで丸ごと消える**。

いまは回避策として、Noto Sans CJK JP で作った**透明画像レイヤーを重ねて**見た目を作っている。`.fig` の中には日本語のテキストノードが編集可能な形で残っているが、CLIからの書き出しでは毎回この回避が要る。

これを解決したい。**日本語がネイティブなテキストとして描画され、画像レイヤーの重ね合わせなしでPNGへ書き出せる状態**にする。

## 分かっている手がかり

前回の作業で判明した事実。

- `listAvailableFontsAsync()` が空配列を返す
- 英数字には OpenPencil 同梱の Inter を使った。同梱フォントは解決できている
- CLI書き出し時のバンドルフォント解決で `ERR_PACKAGE_PATH_NOT_EXPORTED` が出たため、一時ローダーで解決した
- 複数回の `eval -w` で段階保存すると既存ノードが保持されない
- CLI本体は `/home/hal/.local/share/ai-tools/node_modules/@open-pencil/cli/`
- 起動は必ず PATH 上の `/home/hal/.local/bin/openpencil`（ラッパーが `~/.config/ai/openpencil-node-compat.mjs` を読み込む。迂回すると `Bun is not defined` で落ちる）
- GUI (`openpencil-app`) はこのSSHセッションではWSLgを掴めず起動しない。CLIだけで解決したい

## 調べる方向（これに限らない）

- OpenPencil CLI がフォントをどこからどう解決しているか。同梱フォントのディレクトリ構造と、`package.json` の `exports` で何が公開されているか
- `ERR_PACKAGE_PATH_NOT_EXPORTED` が何を要求していたか。前回の一時ローダーが何を回避したか
- 日本語フォント（`fc-list` にあるもの、または OpenPencil が受け付ける形式へ変換したもの）を、CLIが解決できる場所・方法で登録できるか
- `figma.loadFontAsync` にどんなフォント指定が通るか。ファミリ名とスタイルの組み合わせで何が受理され、何が拒否されるか
- テキストノードが「消える」のは、フォント解決の失敗か、グリフ不在か、書き出し段階の別問題か。**まず原因を切り分ける**

## 成果物

1. **原因の特定**。なぜ日本語テキストノードがPNGで消えるのか
2. **解決策**。日本語がネイティブテキストとして書き出せる手順
3. 解決できたら `docs/design/probability-board.fig` を画像レイヤーなしで作り直し、`probability-board-mobile.png` と `probability-board-desktop.png` を書き出し直す
4. 再現手順を `docs/design/openpencil-japanese.md` に記録する

## 制約

- 修正が `~/.config/ai/` や `~/.local/share/ai-tools/` に及ぶ場合、**直接編集しない**。これらはchezmoi管理下で上書きされる。必要な変更内容を具体的に報告すること（どのファイルに何を足すか）。調査のための一時的な適用は `/tmp` に複製してから行う
- リポジトリは `docs/design/` 以外を触らない
- コミットしない
- 依存を勝手に追加しない。必要なら報告する

## 報告

- 原因（切り分けの根拠つき）
- 解決したか。したなら手順、しなかったなら何が壁か
- `~/.config/ai/` や `~/.local/share/ai-tools/` へ必要な変更があれば、その内容
- 解決できなかった場合の次善策と、その限界

**解決できなくても、切り分けた事実は必ず残して報告すること。**
