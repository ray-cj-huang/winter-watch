import { cacheLife, cacheTag } from 'next/cache'
import Dashboard from '@/components/Dashboard'
import EnsoPanel from '@/components/EnsoPanel'
import Sources from '@/components/Sources'
import { getEnsoState } from '@/lib/enso'
import { nino } from '@/lib/format'
import { getForecasts } from '@/lib/forecast'
import { buildMap, projectPoints } from '@/lib/geo'
import { MACRO_LABELS, type MapGeometry, type ProjectedPoint } from '@/lib/map-types'
import { BASE_BLACKOUT_DATES, RESORTS } from '@/lib/resorts'
import type { MacroRegionId } from '@/lib/types'

const MACROS = Object.keys(MACRO_LABELS) as MacroRegionId[]

/**
 * Projected geometry never changes, so it is cached for as long as the
 * platform will hold it and shipped to the client as plain path strings.
 */
async function getMapPayload(): Promise<{
  maps: Record<MacroRegionId, MapGeometry>
  points: Record<MacroRegionId, ProjectedPoint[]>
}> {
  'use cache'
  cacheLife('max')
  cacheTag('map-geometry')

  const maps = {} as Record<MacroRegionId, MapGeometry>
  const points = {} as Record<MacroRegionId, ProjectedPoint[]>

  for (const macro of MACROS) {
    maps[macro] = buildMap(macro)
    points[macro] = projectPoints(
      macro,
      RESORTS.filter((r) => r.macro === macro).map((r) => ({
        id: r.id,
        lat: r.lat,
        lon: r.lon,
      })),
    )
  }
  return { maps, points }
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export default async function Page() {
  const [enso, forecasts, mapPayload] = await Promise.all([
    getEnsoState(),
    getForecasts(),
    getMapPayload(),
  ])

  const advisory = nino(
    enso.phase === 'Neutral' ? 'ENSO Neutral' : `${enso.strength} ${enso.phase}`,
  )

  return (
    <div className="mx-auto max-w-[68rem] px-5 pb-20">
      <header className="flex flex-col gap-3.5 border-b-2 border-ink pb-5 pt-11">
        <p className="eyebrow">ENSO season tracker · 2026–27</p>
        <h1 className="text-[2.1rem] tracking-[-0.02em] sm:text-[2.75rem]">
          El Niño Winter Watch
        </h1>
        <p className="max-w-[34em] font-serif text-lg italic text-ink-soft">
          A live read on the snow season: the ocean signal straight from NOAA, the
          regional split it implies, and which mountains your pass actually reaches.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-ink-faint">
          <span className="inline-flex items-center gap-2 rounded-sm bg-accent px-2.5 py-1 font-semibold uppercase tracking-[0.1em] text-white">
            <span className="h-[7px] w-[7px] rounded-full bg-white" />
            {advisory}
          </span>
          <span>CPC week of {fmtDate(enso.weekEnding)}</span>
          <span>Updated {fmtDate(enso.fetchedAt)}</span>
        </div>
      </header>

      <div className="pt-10">
        <EnsoPanel enso={enso} />
      </div>

      <Dashboard
        enso={enso}
        forecasts={forecasts}
        maps={mapPayload.maps}
        points={mapPayload.points}
      />

      <section className="pt-10">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-rule pb-2.5">
          <h2 className="font-serif text-2xl">How the score works</h2>
          <p className="eyebrow">Probabilities, not promises</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <h3 className="font-serif text-lg">Seasonal signal</h3>
            <p className="mt-1.5 max-w-[60ch] text-sm text-ink-soft">
              Each resort carries a teleconnection coefficient — how its winter
              precipitation responds to El Niño in the historical composites. That is
              scaled by the live event magnitude and by its flavor: eastern-Pacific
              events load the subtropical jet hardest, which is the mechanism that wets
              the southern tier and starves the north.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-lg">Elevation and warmth</h3>
            <p className="mt-1.5 max-w-[60ch] text-sm text-ink-soft">
              El Niño winters run warm, so the snow line — not the storm count — is
              usually the binding constraint. Mountains with high bases absorb warm
              storms; low bases take the same storm as rain. The score penalises low
              terrain in proportion to event strength.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-lg">Live model runs</h3>
            <p className="mt-1.5 max-w-[60ch] text-sm text-ink-soft">
              Once there is snow to forecast, the 16-day NOAA GFS run takes over at a
              65/35 blend with the seasonal signal. In the preseason every grid point
              reads zero, so the app says so rather than ranking on noise.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-lg">Pass fit</h3>
            <p className="mt-1.5 max-w-[60ch] text-sm text-ink-soft">
              A great forecast you can only reach for five blacked-out days is worth
              less than a good one you can reach any weekend. Pass fit multiplies the
              score by how generous your tier actually is at that mountain.
            </p>
          </div>
        </div>

        <div className="mt-6 border border-rule bg-surface p-4">
          <p className="eyebrow mb-2 text-[0.65rem]">
            Ikon Base blackout dates · Northern Hemisphere
          </p>
          <ul className="flex flex-wrap gap-2">
            {BASE_BLACKOUT_DATES.map((b) => (
              <li
                key={b.range}
                className="tnum rounded-sm border border-rule-strong px-2.5 py-1 font-mono text-[0.74rem] text-ink-soft"
              >
                {b.range} <span className="text-ink-faint">· {b.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 max-w-[62ch] text-sm text-ink-faint">
            Alterra adjusts both the roster and the blackout calendar between
            announcement and season, and secondary sources disagree on the details.
            Verify on ikonpass.com before buying anything.
          </p>
        </div>

        <p className="mt-5 max-w-[65ch] border-l-2 border-hot pl-4 text-sm text-ink-soft">
          <strong className="font-semibold">This is a model, not a NOAA product.</strong>{' '}
          The ocean state and every forecast number are live NOAA data. The ranking on
          top of them is this app&apos;s own, calibrated to published ENSO composite
          patterns. For the official probabilistic outlook, go to the CPC seasonal
          outlook linked below.
        </p>
      </section>

      <Sources />

      <footer className="mt-12 flex flex-wrap justify-between gap-x-5 gap-y-1.5 border-t-2 border-ink pt-4 font-mono text-[0.74rem] text-ink-faint">
        <span>El Niño Winter Watch · {RESORTS.length} destinations</span>
        <span>Data: NOAA CPC + NOAA GFS</span>
      </footer>
    </div>
  )
}
