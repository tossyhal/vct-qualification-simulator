# 3画面のデザイン原本を作る

`docs/design/mock.html` を正本として、OpenPencil のデザインデータとPNGを作る。

`mock.html` には3画面ある。`?page=board|about|admin` で切り替わる。

## 成果物

`docs/design/` へ置く。

`probability-board.fig` に次の5フレーム。

| フレーム | 内容 | 幅 |
| --- | --- | --- |
| 確率テーブル | `?page=board`、Alpha選択 | 375 |
| 確率テーブル | 同上 | 1280 |
| 説明 | `?page=about` | 375 |
| 説明 | 同上 | 1280 |
| 管理者 | `?page=admin`、成功状態 | 1280 |

PNGは4枚。

- `probability-board-mobile.png`（確率テーブル375）
- `probability-board-desktop.png`（確率テーブル1280）
- `about-desktop.png`（説明1280）
- `admin-desktop.png`（管理者1280）

## 手順

`docs/design/openpencil-japanese.md` に全部書いてある。**まず読むこと。**

日本語描画は解決済みで `~/.config/ai/openpencil-node-compat.mjs` へ恒久化済み。PATH 上の `openpencil` をそのまま使えば日本語が出る。画像レイヤーでの回避はしない。

## 書体

`docs/DESIGN.md` の「書体」節のとおり。

- 数字と数値記号（`0-9` `%` `<` `–`）は Work Sans、107%へ拡大
- それ以外のラテン文字は Public Sans
- 実体は `apps/web/public/fonts/` にある（読み取りのみ）

## 含めないもの

`mock.html` の確認用の枠は原本に入れない。

- 幅の切り替え（375px / 全幅）
- 管理者ページの状態切り替え
- 「管理者（仮）」の導線

大会タブ（Pacific）とグループタブ（Alpha / Omega）はデザインの一部なので含める。

## 進め方

**フレームを1つ作るごとに `.fig` を保存する。**PNGも作れたものから順に書き出す。全部できてからまとめて保存、という進め方はしない。途中で中断しても、そこまでの成果が残るようにすること。

## 制約

- `docs/design/` 以外を変更しない。`apps/` は読み取りのみ
- コミットしない
- 依存を追加しない
- 中間ファイルは `/tmp` へ

## 報告

各フレームの寸法、日本語テキストノード数、画像レイヤーが0件であること、確認用の枠が入っていないこと、書体の割当漏れ件数、できなかった点。日本語で。
