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

## Types carry the constraints

Prose that backfills a bare `number` is a type smell, not documentation. Reach
for the type system first, and the declaration will read without a comment:

- **A unit, a range or a sign belongs in the type, never in prose.** Units go
  in the identifier (`baseElevationFt`, `snowIn7d`, `highC`). Unitless
  normalised values use the aliases in `src/lib/types.ts` — `SignedUnit`
  ([-1, 1]), `Unit` ([0, 1]), `Score` ([0, 100]) — so the range is written once
  and shows up in hover at every use site.
- **A set of known strings is a union, not `string`.** `ScoreLabel` is derived
  from `SCORE_BANDS`, so renaming a band breaks the build instead of silently
  emptying a table group.
- **A field that is only valid for some variants means a discriminated union.**
  `Access` is split on `kind`, so a day-capped tier cannot exist without its
  `days` count.
- Aliases are conventions, not brands. They document and they do not enforce;
  branding would mean a cast at every literal in `resorts.ts`.

## Comments

The code should read without them. Follow
[TSDoc](https://tsdoc.org/) and the
[Google TypeScript style guide](https://google.github.io/styleguide/tsguide.html#comments-documentation):

- **One comment, one job.** A constraint goes in the type, the physical
  mechanism in the README, the provenance of a dataset next to the data, and
  the weighting next to the code that applies it. A comment covering more than
  one of those is at the wrong altitude — and usually duplicates something
  already written elsewhere, which is two places to keep true.
- **Summary first, `@remarks` after.** In TSDoc everything before the first
  block tag is the summary, and that is what editors show in the hover tooltip.
  Keep it to one sentence and put the background in `@remarks`.
- **`@remarks` past one line becomes bullets.** One proposition per bullet, each
  finishing on its own line. Wrapped prose in a comment is a wall; a reader
  skimming for the one fact they need should find it on a line by itself. If a
  bullet will not fit on a line, it is two bullets or it is too much detail.
- **No comment blocks at the top of a file.** Prose there is addressed to a
  reader with no context, and that reader should be in the README. Anything a
  reader already inside the file needs goes on the declaration it affects, in
  one line. Nearly every header block in this repo turned out to be the README
  copied out of date.
- **If the code enforces it, do not also assert it.** `import 'server-only'`, a
  discriminated union and a derived union are load-bearing. A comment restating
  what they already guarantee is a second copy that can drift out of step.
- **Cross-reference with `@see {@link X}`, never a bare filename.** Editor
  tooling checks the link; a filename in prose rots silently.
- **Every module-level declaration gets `/** … */`, exported or not.** Only a
  doc comment reaches the editor: TypeScript's language service attaches
  `/** … */` to the declaration and shows it on hover, and drops `//` entirely.
  Export has nothing to do with it — a private `const` hovered from inside its
  own file shows its doc comment just the same.
- **`//` is for notes that are not attached to one declaration.** A step inside
  a function body, a load-bearing import, or a note covering a group of
  declarations. A doc comment on a group silently documents only the first one,
  which is worse than not writing it.
- **A doc comment documents the declaration directly beneath it.** With a blank
  line between them it documents nothing — and a note that is really about the
  whole file belongs in the README, not at the top of the file.
- **Never restate the type signature.** TypeScript already says what the
  parameters and the return are. Add `@param` / `@returns` only when they carry
  something the types cannot.
- **No decorative comments.** No `// ==== SECTION ====` banners, no `// ---`
  dividers, no boxed asterisks. If a file needs signposting to navigate, split
  the file.
- **No changelog.** "Replaces the old X" belongs in the commit message, which
  is where anyone can still find it.
- **Say why, not what.** A parser quirk, a NOAA cadence, a weighting choice, a
  threshold someone would otherwise tune blindly. If a comment restates the
  line below it, delete the comment.

## Conventions

- No semicolons, single quotes, 2-space indent. Match the file you are in.
- Server Components by default; add `'use client'` only where interaction needs
  it, and keep those leaves small.
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
