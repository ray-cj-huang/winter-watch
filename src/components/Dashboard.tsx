'use client'

import { useMemo, useState } from 'react'
import type { EnsoState } from '@/lib/enso'
import { num } from '@/lib/format'
import type { ResortForecast } from '@/lib/forecast'
import type { MapGeometry, ProjectedPoint } from '@/lib/map-types'
import { MACRO_LABELS } from '@/lib/map-types'
import { RESORTS } from '@/lib/resorts'
import { pickMode, scoreResorts, type ScoreMode } from '@/lib/score'
import type { MacroRegionId, PassId } from '@/lib/types'
import ResortMap from './ResortMap'
import ResortTable from './ResortTable'
import ForecastStrip from './ForecastStrip'
import SectionHeader from './SectionHeader'

const PASSES: { id: PassId; label: string; blurb: string }[] = [
  { id: 'ikon-base', label: 'Ikon Base', blurb: 'Base tier · 5 days at most destinations' },
  { id: 'ikon', label: 'Ikon', blurb: 'Full pass · 7 days at partners, unlimited at core' },
]

const MACRO_ORDER: MacroRegionId[] = ['us', 'canada', 'europe', 'japan', 'southern']

interface Props {
  enso: EnsoState
  forecasts: Record<string, ResortForecast>
  maps: Record<MacroRegionId, MapGeometry>
  points: Record<MacroRegionId, ProjectedPoint[]>
}

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string; disabled?: boolean }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="eyebrow text-micro">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={o.disabled}
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={`border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:text-ink-faint/50 ${
              value === o.id
                ? 'border-ink bg-ink text-paper'
                : 'border-rule bg-surface text-ink-soft hover:bg-surface-sunk'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function Dashboard({ enso, forecasts, maps, points }: Props) {
  const [pass, setPass] = useState<PassId>('ikon-base')
  const [macro, setMacro] = useState<MacroRegionId>('us')
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const inRegion = useMemo(() => RESORTS.filter((r) => r.macro === macro), [macro])

  // The model picks the honest default per region: in the northern preseason
  // every US grid point reads zero, so ranking on it would be noise. The user
  // can still force either mode.
  const autoMode = useMemo(() => pickMode(inRegion, forecasts), [inRegion, forecasts])
  const [modeOverride, setModeOverride] = useState<ScoreMode | null>(null)
  const mode: ScoreMode = modeOverride ?? autoMode

  const scored = useMemo(
    () => scoreResorts(inRegion, pass, enso, forecasts, mode),
    [inRegion, pass, enso, forecasts, mode],
  )

  const selected = scored.find((s) => s.resort.id === selectedId) ?? null

  // Count per region for the switcher, so empty tiers are obvious up front.
  const regionCounts = useMemo(() => {
    const counts = {} as Record<MacroRegionId, number>
    for (const m of MACRO_ORDER) {
      counts[m] = RESORTS.filter((r) => r.macro === m && r.access[pass]).length
    }
    return counts
  }, [pass])

  const passInfo = PASSES.find((p) => p.id === pass)!

  return (
    <section className="pt-10">
      <SectionHeader title="Your pass, mapped to the signal" meta={<>{scored.length} destination{scored.length === 1 ? '' : 's'}</>} />

      <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <Segmented
          label="Pass"
          value={pass}
          options={PASSES.map((p) => ({ id: p.id, label: p.label }))}
          onChange={(p) => {
            setPass(p)
            setSelectedId(null)
          }}
        />
        <Segmented
          label="Region"
          value={macro}
          options={MACRO_ORDER.map((m) => ({
            id: m,
            label: MACRO_LABELS[m],
            disabled: regionCounts[m] === 0,
          }))}
          onChange={(m) => {
            setMacro(m)
            setSelectedId(null)
            setModeOverride(null)
          }}
        />
        <Segmented
          label="Rank by"
          value={mode}
          options={[
            { id: 'seasonal' as ScoreMode, label: 'Seasonal' },
            { id: 'live' as ScoreMode, label: 'Live GFS' },
          ]}
          onChange={(m) => setModeOverride(m)}
        />
      </div>

      <p className="mt-3 text-sm text-ink-soft">
        {passInfo.blurb}.{' '}
        {mode === 'seasonal' ? (
          <>
            Ranking on the <strong className="font-semibold">seasonal</strong> ENSO
            signal.
            {autoMode === 'seasonal' && modeOverride === null && (
              <> The 16-day forecast is dry everywhere, so there is nothing live to rank yet.</>
            )}
          </>
        ) : (
          <>
            Ranking on the <strong className="font-semibold">live GFS run</strong>, mixed
            65/35 with the seasonal signal so one model run does not decide the order.
          </>
        )}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="border border-rule bg-surface p-2">
            <ResortMap
              geometry={maps[macro]}
              points={points[macro]}
                scored={scored}
                mode={mode}
              selectedId={selectedId}
              onSelect={setSelectedId}
            />
          </div>


          {selected && (
            <div className="mt-4 border border-rule bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-serif text-xl">{selected.resort.name}</h3>
                <a
                  href={selected.resort.website}
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-meta uppercase tracking-wide text-accent underline underline-offset-4"
                >
                  Resort site ↗
                </a>
              </div>

              <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                {[
                  { k: 'Seasonal', v: `${Math.round(selected.seasonalScore)}` },
                  {
                    k: 'Live GFS',
                    v: selected.liveScore === null ? '—' : `${Math.round(selected.liveScore)}`,
                  },
                  {
                    k: 'Avg snow',
                    v: `${selected.resort.avgAnnualSnowIn}"`,
                  },
                  {
                    k: 'Vertical',
                    v: `${num(
                      selected.resort.summitElevationFt - selected.resort.baseElevationFt,
                    )} ft`,
                  },
                ].map((x) => (
                  <div key={x.k}>
                    <dt className="font-mono text-micro uppercase tracking-wide text-ink-faint">
                      {x.k}
                    </dt>
                    <dd className="tnum font-mono text-base">{x.v}</dd>
                  </div>
                ))}
              </dl>

              {selected.forecast && <ForecastStrip forecast={selected.forecast} />}

              <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 font-mono text-meta text-ink-faint">
                <a
                  className="underline underline-offset-4 hover:text-accent"
                  href={`https://forecast.weather.gov/MapClick.php?lat=${selected.resort.lat}&lon=${selected.resort.lon}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  NWS point forecast ↗
                </a>
                <a
                  className="underline underline-offset-4 hover:text-accent"
                  href={`https://www.google.com/maps/search/?api=1&query=${selected.resort.lat},${selected.resort.lon}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Map ↗
                </a>
              </p>
            </div>
          )}
        </div>

        <div className="min-w-0">
          <ResortTable
            scored={scored}
            mode={mode}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>
    </section>
  )
}
