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

## Cloudflare deployment

The frontend and API are deployed separately:

1. Create a D1 database named `vct-sim` and replace the placeholder database ID in
   `apps/worker/wrangler.jsonc`.
2. Apply migrations with `npm run db:migrate:remote -w @vct-sim/worker`.
3. Deploy the API with `npm run deploy -w @vct-sim/worker`.
4. Create a Pages project from this repository using `npm run build -w @vct-sim/web`
   and `apps/web/dist` as its output directory.
5. Set `VITE_API_BASE` on Pages to the deployed Worker URL.

The production Cron Trigger runs at 18:00 UTC (03:00 JST) once per day.

## Data and attribution

Tournament data is sourced from
[Liquipedia VALORANT Wiki](https://liquipedia.net/valorant/VCT/2026/Pacific_League/Stage_2)
and is available under CC BY-SA 3.0. Team logos remain subject to their respective
owners' rights.

This project is not affiliated with or sponsored by Riot Games, VALORANT Esports,
or Liquipedia.
