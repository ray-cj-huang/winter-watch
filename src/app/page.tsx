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
import SectionHeader from '@/components/SectionHeader'

const MACROS = Object.keys(MACRO_LABELS) as MacroRegionId[]

/**
 * Projected geometry for every region, as plain SVG path strings.
 *
 * @remarks
 * It never changes, so it is cached for as long as the platform will hold it.
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
    <div className="mx-auto max-w-[68rem] px-5 pb-12">
      <header className="flex flex-col gap-3.5 border-b-2 border-ink pb-5 pt-11">
        <p className="eyebrow text-xs">ENSO season tracker · 2026–27</p>
        <h1 className="text-4xl tracking-tight sm:text-5xl">
          El Niño Winter Watch
        </h1>
        <p className="font-serif text-lg italic text-ink-soft">
          Live NOAA data on this winter&apos;s El Niño, and which resorts on your
          pass are best placed for it.
        </p>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-ink-faint">
          <span className="inline-flex items-center gap-2 rounded-sm bg-accent px-2.5 py-1 font-semibold uppercase tracking-widest text-white">
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
      <SectionHeader title="How the score works" meta="Probabilities, not promises" />

        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <h3 className="font-serif text-lg">Seasonal signal</h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              Every resort has a coefficient for how its winter precipitation
              responded to past El Niños. That gets scaled by how strong the current
              event is and where its warmest water sits. Eastern-Pacific events steer
              the subtropical jet across the southern US, so the south gets storms the
              north misses.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-lg">Elevation and warmth</h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              El Niño winters run warm, so how high the snow falls matters more than
              how often it storms. A resort with a high base keeps the snow. A low one
              gets the same storm as rain. Stronger events push the snow line higher,
              so low resorts lose more.
            </p>
          </div>
          <div>
            <h3 className="font-serif text-lg">Live model runs</h3>
            <p className="mt-1.5 text-sm text-ink-soft">
              Once snow shows up in the forecast, the 16-day NOAA GFS run takes over,
              mixed 65/35 with the seasonal signal. Before the season starts every
              point reads zero, so the app ranks on the seasonal signal and tells you
              it is doing so.
            </p>
          </div>
        </div>

        <div className="mt-6 border border-rule bg-surface p-4">
          <p className="eyebrow mb-2 text-micro">
            Ikon Base blackout dates · Northern Hemisphere
          </p>
          <ul className="flex flex-wrap gap-2">
            {BASE_BLACKOUT_DATES.map((b) => (
              <li
                key={b.range}
                className="tnum rounded-sm border border-rule-strong px-2.5 py-1 font-mono text-meta text-ink-soft"
              >
                {b.range} <span className="text-ink-faint">· {b.label}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-ink-faint">
            Alterra adjusts both the roster and the blackout calendar between
            announcement and season, and secondary sources disagree on the details.
            Verify on ikonpass.com before buying anything.
          </p>
        </div>

        <p className="mt-4 border border-rule border-l-[3px] border-l-hot bg-surface px-4 py-3.5 text-sm text-ink-soft">
          <strong className="font-semibold">This is a model, not a NOAA product.</strong>{' '}
          Every ocean and forecast number here comes from NOAA. The ranking built on
          them is this app&apos;s own, based on published ENSO composite patterns. For
          NOAA&apos;s official probability forecast, see the CPC seasonal outlook
          below.
        </p>
      </section>

      <Sources />

      <footer className="mt-12 flex flex-wrap justify-between gap-x-5 gap-y-1.5 border-t-2 border-ink pt-4 font-mono text-meta text-ink-faint">
        <span>El Niño Winter Watch · {RESORTS.length} destinations</span>
        <span>Data: NOAA CPC + NOAA GFS</span>
      </footer>
    </div>
  )
}
