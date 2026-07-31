# VCT Qualification Simulator

VCTの総当たりグループステージについて、残り試合をすべて50%として100,000回の
Monte Carloシミュレーションを行い、事前集計した通過確率を表示するサイトです。

初期対応大会は VCT 2026 Pacific Stage 2 です。

## Architecture

- `apps/web`: React + Viteの閲覧専用UI（Cloudflare Pages）
- `apps/worker`: Hono API + 日次Scheduled Worker
- `packages/shared`: 大会モデル、順位計算、Monte Carlo
- Cloudflare D1: 取得スナップショットと集計結果
- Liquipedia MediaWiki API: 大会データ

## Commands

```sh
npm install
npm run dev
npm run check
```

## Data and attribution

Tournament data is sourced from
[Liquipedia VALORANT Wiki](https://liquipedia.net/valorant/VCT/2026/Pacific_League/Stage_2)
and is available under CC BY-SA 3.0. Team logos remain subject to their respective
owners' rights.

This project is not affiliated with or sponsored by Riot Games, VALORANT Esports,
or Liquipedia.

