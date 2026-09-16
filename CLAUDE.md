# Winter Watch

A Next.js app that ranks Ikon pass destinations against the live NOAA ENSO
state and GFS forecast. Read `README.md` first for what the app does and why
the score is built the way it is; this file covers how to work in the repo.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

Cache Components is on (`next.config.ts`), so the defaults are not the ones you
remember: data is dynamic unless a function opts in with `'use cache'`.

The block above is managed by `next dev`, which rewrites it in place on every
start. Leave the markers alone and add project guidance below them. This file is
the only agent-instruction file in the repo — there is deliberately no
`AGENTS.md`; `next dev` hosts its block here when that file is absent.

## Commands

```bash
pnpm install
pnpm dev        # localhost:3111 (see .claude/launch.json)
pnpm lint
pnpm typecheck
pnpm build      # run before pushing; catches Cache Components errors lint misses
```

pnpm only — the lockfile and `pnpm-workspace.yaml` (which allows the
`unrs-resolver` build) both assume it.

## Invariants

These are load-bearing. Breaking one is a bug even if it typechecks.

- **No hardcoded NOAA numbers.** Every ocean and forecast value is fetched live
  from CPC or GFS. Sample data, fallback constants and "last known" values do
  not belong in this repo — if a feed is down, the app should say so.
- **`src/lib/resorts.ts` is the only roster.** Access tiers, day limits and
  blackouts live there and nowhere else. Adding a pass means adding a `PassId`
  plus an `access` entry per resort, not a second table.
- **Map geometry is projected server-side.** `src/lib/geo.ts` turns topojson
  into plain SVG path strings before anything reaches the client. d3-geo and
  the atlases must never enter the client bundle — check the build output if
  you touch this.
- **Cached fetches carry a tag.** NOAA reads use `'use cache'` +
  `cacheLife('hours')` + `cacheTag('noaa')` so `GET /api/refresh` can
  invalidate them. Geometry uses `cacheLife('max')` + `cacheTag('map-geometry')`.
- **Pin every locale-sensitive format.** Bare `toLocaleString` /
  `toLocaleDateString` resolve against the runtime's locale and hydrate
  differently on the server and the client. Numbers go through
  `src/lib/format.ts`; dates pass an explicit `'en-US'` and `timeZone: 'UTC'`.
- **The score is a model, not a NOAA product.** Any UI that presents a ranking
  keeps that distinction visible. Do not soften the disclaimers.

## Conventions

- No semicolons, single quotes, 2-space indent. Match the file you are in.
- Server Components by default; add `'use client'` only where interaction needs
  it, and keep those leaves small.
- Comments explain *why* — a parser quirk, a NOAA cadence, a weighting choice.
  Skip comments that restate the code.
- Tailwind v4 with theme tokens from `src/app/globals.css` (`ink`, `ink-soft`,
  `ink-faint`, `rule`, `surface`, `accent`). Do not reintroduce one-off hex
  values or arbitrary font sizes.
- Scoring changes need a note in the README's "How the score works" section.
  The weights are an editorial position, so they get explained, not just
  changed.

## Working style

- This is a public repo. Assume every change is read by strangers.
- Verify NOAA parser changes against real feed responses, not invented
  fixtures — `src/lib/enso.ts` documents why the weekly file is awkward.
- End commits with `Co-Authored-By:` when Claude wrote the change. The project
  discloses AI assistance in the README and the history should match it.
