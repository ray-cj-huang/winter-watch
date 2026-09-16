# El Niño Winter Watch

A live read on the 2026–27 snow season: NOAA's ocean signal, the regional split it
implies, and which mountains your Ikon pass actually reaches.

Pick a pass tier and a region; the app ranks every destination that tier reaches
against the current ENSO state and the live GFS run, and plots them on a map.

## Why it exists

Seasonal forecasts and pass rosters are usually read separately. The interesting
question is where they *agree* — a great forecast you can only reach for five
blacked-out days is worth less than a good one you can ski any weekend.

## Data

Everything numeric is live NOAA, re-fetched on a schedule. Nothing is hardcoded.

| Source | Used for | Cadence |
| --- | --- | --- |
| [CPC weekly Niño SSTs](https://www.cpc.ncep.noaa.gov/data/indices/wksst9120.for) | Niño 1+2 / 3 / 3.4 / 4 anomalies, event strength and flavour | Mondays |
| [CPC Oceanic Niño Index](https://www.cpc.ncep.noaa.gov/data/indices/oni.ascii.txt) | Official 3-month running mean | Monthly |
| [NOAA GFS](https://www.ncei.noaa.gov/products/weather-climate-models/global-forecast) (via Open-Meteo) | 16-day point forecasts for all 58 resorts | 00/06/12/18Z |

The CPC weekly file is fixed-width and its columns collide when an anomaly is
negative (`22.4-0.1`), so the parser pulls signed decimal tokens rather than
splitting on whitespace. It is exercised against all ~2,350 rows of history.

## How the score works

Four inputs, all in `src/lib/score.ts`:

1. **Teleconnection.** Each resort carries an `ensoSensitivity` in `[-1, 1]` —
   how its winter precipitation responds to El Niño in the historical composites.
   That is scaled by live event magnitude and by *flavour*: eastern-Pacific events
   (warm Niño 1+2, cool Niño 4) load the subtropical jet hardest, which is the
   mechanism that wets the southern tier and starves the north.
2. **Elevation resilience.** El Niño winters run warm, so the snow line — not the
   storm count — is usually the binding constraint. Base elevation is weighted
   above summit: a high peak over a rainy base is still a rainy ski day.
3. **Climatological baseline.** A favored mediocre year somewhere that averages
   600 in still beats a favored year somewhere that averages 100 in.
4. **Live GFS.** Once there is snow to forecast, the 16-day run takes over at a
   65/35 blend with the seasonal signal. One model run is not a winter.

In the northern preseason every US grid point reads zero, so the app says so and
ranks on the seasonal signal instead of on noise. That choice is made *per region*,
so a Southern Hemisphere resort in the middle of its own winter never drags the
US view into live mode.

**This is a model, not a NOAA product.** The ocean state and the forecasts are
live NOAA data; the ranking on top of them is this app's own, calibrated to
published ENSO composite patterns. For the official probabilistic outlook, see the
[CPC seasonal outlooks](https://www.cpc.ncep.noaa.gov/products/predictions/long_range/seasonal.php).

## Pass rosters

`src/lib/resorts.ts` is the single source of truth for access, day limits and
blackouts — nothing else hardcodes a roster. Alterra adjusts both the roster and
the blackout calendar between announcement and season, and secondary sources
disagree on the details, so **verify on [ikonpass.com](https://www.ikonpass.com/en/ski-resorts)
before buying anything.** Epic and other passes are next; adding one means adding
a `PassId` and an `access` entry per resort.

## Stack

Next.js 16 (App Router, Cache Components), React 19, Tailwind v4, TypeScript, pnpm.

- NOAA fetches are wrapped in `use cache` with `cacheLife('hours')` and tagged
  `noaa`, so the page prerenders as a static shell and refreshes on a schedule.
- `GET /api/refresh` invalidates the `noaa` tag. Vercel Cron calls it every six
  hours (`vercel.ts`); it is also safe to call by hand when CPC publishes.
- Map geometry is projected **server-side** into plain SVG path strings, so
  d3-geo and the topojson atlases never reach the client bundle. World views are
  clipped to each region's bounding box first.

## Develop

```bash
pnpm install
pnpm dev
```

### Environment

| Variable | Required | Purpose |
| --- | --- | --- |
| `CRON_SECRET` | Production only | Bearer token Vercel Cron presents to `/api/refresh`. Unset locally, which leaves the route open. |

## Deploy

Deploys to Vercel with no configuration beyond `vercel.ts`. Set `CRON_SECRET` in
project settings so the refresh endpoint is not publicly callable.
