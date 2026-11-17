# make.fun frontend

[![make.fun frontend bounty](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/c/makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/jefriidan15/makefun-frontend-01/rank.svg)](https://make.fun/c/makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/jefriidan15/makefun-frontend-01/reward.svg)](https://make.fun/c/makefun-frontend-01)

A fast, accessible frontend for [make.fun](https://make.fun), built from
static files with no build step and no framework. It reads only make.fun's
public API (`https://make.fun/api`, GET, CORS open) — no sign-in, no writes.

## Surfaces

- **Board** `#/` — live bounties with live pot, entry fee, time left
  (judged by deadline, not status alone), and entry count. Search, sort
  (pot / deadline / entries), client-side pagination (20 at a time).
- **Bounty page** `#/bounty/<slug>` — summary, description, rules, rewards
  table with the live pot, dates, open/closed-by-deadline status.
- **Leaderboard** `#/bounty/<slug>/leaderboard` — top 10: rank, handle,
  entry, judge win rate, 90% interval, dossier size.
- **Profile** `#/u/<handle>` — bio, avatar, record (entered / placed /
  won / best placement / prize money), and the entry list.

## Performance

- First load is a handful of tiny files (see `dossier.json`'s Totals line).
- API answers are cached in memory + `localStorage` and revalidated with
  `If-None-Match` per minute bucket (the API's ETags are minute-bound), so a
  view costs at most one request and a revisit inside the minute costs none.
- The leaderboard payload is fetched once per bounty and cached.

## Run it

```sh
node serve.ts          # serves app/ on http://localhost:8080
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

Entry for the
[make.fun frontend bounty](https://make.fun/c/makefun-frontend-01).
MIT licensed.
