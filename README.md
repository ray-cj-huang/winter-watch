# El Niño Winter Watch

A live read on the 2026–27 snow season: NOAA's ocean signal, the regional split it
implies, and which mountains your Ikon pass actually reaches.

Pick a pass tier and a region; the app ranks every destination that tier reaches
against the current ENSO state and the live GFS run, and plots them on a map.

**[winter-watch.vercel.app](https://winter-watch.vercel.app)**

## Why it exists

Seasonal forecasts and pass rosters are normally read separately. This puts them
side by side, so you can see which of the resorts you can actually ski are the
ones the winter pattern favours.

## Data

Everything numeric is live NOAA, re-fetched on a schedule. Nothing is hardcoded.

| Source | Used for | Cadence |
| --- | --- | --- |
| [CPC weekly Niño SSTs](https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for) | Niño 1+2 / 3 / 3.4 / 4 anomalies, event strength and flavour | Weekly (Mondays) |
| [CPC Oceanic Niño Index](https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt) | Official 3-month running mean | Monthly |
| [NOAA GFS](https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast) (via Open-Meteo) | 16-day point forecasts for all 58 resorts | 4× daily (every 6 hours, UTC) |

The CPC weekly file is fixed-width and its columns collide when an anomaly is
negative (`22.4-0.1`), so the parser pulls signed decimal tokens rather than
splitting on whitespace. It is exercised against all ~2,350 rows of history.

## How the score works

Four inputs, all in `src/lib/score.ts`:

1. **Teleconnection.** Each resort has an `ensoSensitivity` in `[-1, 1]` for how
   its winter precipitation responded to past El Niños. That gets scaled by the
   current event's magnitude and by its flavour: eastern-Pacific events (warm
   Niño 1+2, cool Niño 4) steer the subtropical jet across the southern US, so
   the south gets storms the north misses.
2. **Elevation resilience.** El Niño winters run warm, so how high the snow
   falls matters more than how often it storms. Base elevation outweighs summit,
   because a high peak above a rainy base is still a rainy ski day.
3. **Climatological baseline.** A mediocre year somewhere averaging 600 in of
   snow still beats a good year somewhere averaging 100 in.
4. **Live GFS.** Once snow shows up in the forecast, the 16-day run takes over,
   mixed 65/35 with the seasonal signal so a single run does not decide the
   order.

The weights are an editorial position rather than a fitted model, so here they
are in full:

| Term | Range | What it does |
| --- | --- | --- |
| Teleconnection backbone | 0–100 | `50 + 50 × effect`, where `effect = ensoSensitivity × gain`, clamped to `[-1, 1]` |
| Flavour gain | ×0.7–1.3 | `0.7 + 0.6 × epGradient`; `epGradient` is the Niño 1+2 minus Niño 4 spread over 3 |
| Event magnitude | 0–1 | `abs(Niño 3.4) / 2`, so the "very strong" threshold maps to 1 |
| Elevation resilience | 0–1 | `0.65 × base + 0.35 × summit`, normalised over 2,000–9,500 ft and 4,000–13,000 ft |
| Warm-storm penalty | 0 to −18 | `magnitude × (1 − resilience) × 18` |
| Climatological baseline | ±6 | `(norm(avgAnnualSnowIn, 90, 600) − 0.5) × 12` |
| Live: 7-day snow | 0–78 | ceiling at 24 in, which is a very good week |
| Live: 16-day depth | 0–22 | ceiling at 48 in |
| Live: rain penalty | 0 to −22 | −3 per day warm and wet enough to rain at grid level |
| Seasonal/live blend | 65/35 | live leads, but one model run cannot decide the order |
| Live-mode trigger | 6 in | the best 7-day total on screen, above which the board flips to live |

In the northern preseason every US grid point reads zero, so the app says so and
ranks on the seasonal signal instead of on noise. That choice is made *per region*,
so a Southern Hemisphere resort in the middle of its own winter never drags the
US view into live mode.

**This is a model, not a NOAA product.** The ocean state and the forecasts are
live NOAA data; the ranking on top of them is this app's own, calibrated to
published ENSO composite patterns. For the official probabilistic outlook, see the
[CPC seasonal outlooks](https://www.cpc.ncep.noaa.gov/products/predictions/long_range/seasonal.php).

## Sharing

Every view has an address. Pass tier, region, ranking mode and the selected
resort all live in the query string (`/?pass=ikon&macro=japan&id=niseko`), so a
link reproduces exactly what was on screen. Each of the 58 destinations also has
its own page at `/resort/<id>`, with its standing, its forecast and the access
rules for both tiers.

Links unfurl as rendered cards, generated on demand by `/api/og` from the same
cached NOAA reads the page uses — a board, a single resort, or the ocean state
with its trailing weeks of Niño 3.4. Every card carries the same "model, not a
NOAA product" line the page does, because a card gets reposted without the page
attached. `Card ↓` next to any view downloads it as a PNG.

## Pass rosters

`src/lib/resorts.ts` is the single source of truth for access, day limits and
blackouts — nothing else hardcodes a roster. Alterra adjusts both the roster and
the blackout calendar between announcement and season, and secondary sources
disagree on the details, so **verify on [ikonpass.com](https://www.ikonpass.com/en/destinations)
before buying anything.** Epic and other passes are next; adding one means adding
a `PassId` and an `access` entry per resort.

## Stack

Next.js 16 (App Router, Cache Components), React 19, Tailwind v4, TypeScript, pnpm.

- NOAA fetches are wrapped in `use cache` with `cacheLife('hours')` and tagged
  `noaa`, so the page prerenders as a static shell and refreshes on a schedule.
- `GET /api/refresh` invalidates the `noaa` tag. Vercel Cron calls it daily
  (`vercel.ts`) — Hobby plans reject anything more frequent, and the cached
  fetches self-revalidate hourly anyway, so the cron is a floor rather than the
  refresh path. It is also safe to call by hand when CPC publishes.
- Map geometry is projected **server-side** into plain SVG path strings, so
  d3-geo and the topojson atlases never reach the client bundle. World views are
  clipped to each region's bounding box first, and path coordinates are rounded
  to one decimal — sub-pixel at this viewBox, and a quarter of the bytes.
- Share cards are rendered by `next/og`, which ships inside Next and takes font
  buffers rather than CSS; the two faces live in `assets/fonts`.
- `@vercel/analytics` is the only third-party script, and it sets no cookies.

## Develop

```bash
pnpm install
pnpm dev
```

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `CRON_SECRET` | Production only | Bearer token Vercel Cron presents to `/api/refresh`. Unset locally, which leaves the route open. |
| `NEXT_PUBLIC_SITE_URL` | No | Absolute origin for canonical URLs and card images. Falls back to the production domain, and to the deployment's own URL on previews. |

## Deploy

Deploys to Vercel with no configuration beyond `vercel.ts`. Set `CRON_SECRET` in
project settings so the refresh endpoint is not publicly callable.

## Built with AI

Most of this was written by an AI coding assistant, with a human pointing it at
things and reading the diffs. Worth knowing where that does and does not matter:

- **The numbers are real; the opinions are mine.** Every value on the page comes
  from a live NOAA endpoint, and the fiddly parts — that fixed-width CPC weekly
  file especially — were checked against the actual feeds, not invented
  fixtures. The scoring weights in `src/lib/score.ts` are one reading of
  published ENSO composites. They are written down so you can disagree with
  them.
- **The pass roster is hand-compiled** from published Alterra material, so it
  can be wrong or go stale. Check
  [ikonpass.com](https://www.ikonpass.com/en/destinations) before buying
  anything.
- **None of this is a forecast.** For the official probabilistic outlook, see the
  [CPC seasonal outlooks](https://www.cpc.ncep.noaa.gov/products/predictions/long_range/seasonal.php).

[`CLAUDE.md`](CLAUDE.md) holds the conventions and invariants the assistant works
under. It happens to be an accurate tour of the codebase for humans too.

## Contributing

Roster corrections, extra passes and scoring arguments are all welcome — see
[`CONTRIBUTING.md`](CONTRIBUTING.md). CI runs `pnpm lint`, `pnpm typecheck` and
`pnpm build` on every pull request. Participation is covered by the
[code of conduct](CODE_OF_CONDUCT.md); security issues go through
[`SECURITY.md`](SECURITY.md) rather than a public issue.

## License

[MIT](LICENSE). NOAA data is in the public domain; resort and pass names belong
to their respective owners, and this project is not affiliated with or endorsed
by NOAA, Alterra Mountain Company or any resort.
