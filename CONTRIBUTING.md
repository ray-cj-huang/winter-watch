# Contributing

Issues and pull requests are welcome. This is a small project, so the process
is light.

## Getting set up

```bash
pnpm install
pnpm dev
```

The app runs on [localhost:3111](http://localhost:3111). No API keys are
needed — every data source is a public NOAA endpoint. `CRON_SECRET` only
matters in production; see [`.env.example`](.env.example).

## Before you open a PR

```bash
pnpm lint
pnpm typecheck
pnpm build
```

`pnpm build` is the one that matters most: Cache Components errors (a `use
cache` function reading request data, an uncached fetch in a prerendered
shell) only surface at build time. CI runs all three.

## What is most useful

- **Pass roster corrections.** [`src/lib/resorts.ts`](src/lib/resorts.ts) is
  the single source of truth for access tiers, day limits and blackouts.
  Alterra changes these between announcement and season, so fixes here age
  well. Please link the [ikonpass.com](https://www.ikonpass.com/en/ski-resorts)
  page you checked against.
- **Another pass.** Adding Epic or Mountain Collective means adding a `PassId`
  and an `access` entry per resort — no second table.
- **Scoring.** The weights in [`src/lib/score.ts`](src/lib/score.ts) are an
  editorial call informed by published ENSO composites. If you change one,
  explain the reasoning in the PR and update the README's "How the score
  works" section to match.

## House rules

- Everything numeric stays live NOAA. No sample data, fallback constants or
  "last known good" values — if a feed is down, the app should say so.
- Keep the model-not-a-forecast disclaimers intact. This app ranks; NOAA
  forecasts.
- Match the surrounding style: no semicolons, single quotes, Server Components
  by default.
- If you used an AI assistant, say so in the PR description. It is not a
  problem here — the project itself was built that way — but reviewers should
  know what to look at closely.

[`CLAUDE.md`](CLAUDE.md) has the fuller set of conventions and invariants. It
is aimed at AI coding assistants, but it describes the codebase accurately for
humans too.

By taking part you agree to the [code of conduct](CODE_OF_CONDUCT.md), which is
short and amounts to being decent to people. Found something exploitable?
Please report it privately — [`SECURITY.md`](SECURITY.md) explains how, and
what is actually in scope for an app with no accounts and no database.
