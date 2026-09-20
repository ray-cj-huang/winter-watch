'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import type { EnsoState } from '@/lib/enso'
import { num } from '@/lib/format'
import type { ResortForecast } from '@/lib/forecast'
import type { MapGeometry, ProjectedPoint } from '@/lib/map-types'
import { MACRO_LABELS } from '@/lib/map-types'
import { RESORTS } from '@/lib/resorts'
import {
  autoScoreMode,
  scoreResorts,
  type MappableResort,
  type ScoreMode,
} from '@/lib/score'
import type { MacroRegionId, PassId } from '@/lib/types'
import { summarise } from '@/lib/summary'
import { boardVerdict } from '@/lib/verdict'
import {
  MACRO_IDS,
  PASS_BLURBS,
  PASS_IDS,
  PASS_LABELS,
  viewStatePath,
  type ViewState,
} from '@/lib/view-state'
import BlackoutDates from './BlackoutDates'
import GlobalLeaders from './GlobalLeaders'
import RegionSplit from './RegionSplit'
import ForecastStrip from './ForecastStrip'
import ResortMap from './ResortMap'
import ResortTable, { type TableResort } from './ResortTable'
import SectionHeader from './SectionHeader'
import ShareLink from './ShareLink'

interface Props {
  enso: EnsoState
  forecasts: Record<string, ResortForecast>
  maps: Record<MacroRegionId, MapGeometry>
  points: Record<MacroRegionId, ProjectedPoint[]>
  initialView: ViewState
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

const ALL = 'all'

export default function Dashboard({ enso, forecasts, maps, points, initialView }: Props) {
  const [pass, setPass] = useState<PassId | null>(initialView.pass)
  const [macro, setMacro] = useState<MacroRegionId | null>(initialView.macro)
  const [modeOverride, setModeOverride] = useState<ScoreMode | null>(initialView.mode)
  const [selectedId, setSelectedId] = useState<string | null>(initialView.selectedId)

  /**
   * Move the board and the address bar together.
   *
   * @remarks
   * - `replaceState` avoids a server round trip on every control click.
   * - It keeps Back meaning the previous page, not the previous filter.
   */
  function update(patch: Partial<ViewState>) {
    const next: ViewState = { pass, macro, mode: modeOverride, selectedId, ...patch }
    setPass(next.pass)
    setMacro(next.macro)
    setModeOverride(next.mode)
    setSelectedId(next.selectedId)
    window.history.replaceState(null, '', viewStatePath(next))
  }

  // Whatever is on screen, which is the set `pickMode` is meant to judge.
  const pool = useMemo(
    () => RESORTS.filter((r) => (!pass || r.access[pass]) && (!macro || r.macro === macro)),
    [pass, macro],
  )

  const autoMode = useMemo(
    () => autoScoreMode(pool, forecasts, macro),
    [pool, forecasts, macro],
  )
  const mode: ScoreMode = modeOverride ?? autoMode

  // A map needs a region and access glyphs need a tier, so the full board
  // waits until both are chosen. Until then the summary stands in.
  const isBoard = pass !== null && macro !== null

  const scored = useMemo(
    () => (pass && macro ? scoreResorts(pool, pass, enso, forecasts, mode) : []),
    [pass, macro, pool, enso, forecasts, mode],
  )

  const summary = useMemo(
    () => (isBoard ? null : summarise(enso, forecasts, mode, pass, macro)),
    [isBoard, enso, forecasts, mode, pass, macro],
  )

  const selected = scored.find((s) => s.resort.id === selectedId) ?? null

  // A map colours by score, which needs no tier, so it can draw either set.
  const mapRows: MappableResort[] = isBoard ? scored : (summary?.leaders ?? [])

  // Without a tier there is no access glyph, so the column names the pass.
  const regionRows: TableResort[] = useMemo(
    () =>
      (summary?.leaders ?? []).map((l) => ({
        resort: l.resort,
        score: l.score,
        verdict: l.verdict,
        forecast: forecasts[l.resort.id] ?? null,
        tag: l.families.length > 1 ? 'Both' : l.families[0],
      })),
    [summary, forecasts],
  )
  const leader = isBoard ? scored[0] : summary?.leaders[0]
  const count = isBoard ? scored.length : (summary?.count ?? 0)

  // Count per region for the switcher, so empty tiers are obvious up front.
  const regionCounts = useMemo(() => {
    const counts = {} as Record<MacroRegionId, number>
    for (const m of MACRO_IDS) {
      counts[m] = RESORTS.filter((r) => r.macro === m && (!pass || r.access[pass])).length
    }
    return counts
  }, [pass])

  const cardUrl = `/api/og?card=board${pass ? `&pass=${pass}` : ''}${macro ? `&macro=${macro}` : ''}&mode=${mode}`

  return (
    <section className="pt-10">
      <SectionHeader
        title={isBoard ? 'Your pass, mapped to the signal' : 'Where the signal points'}
        meta={<>{count} destination{count === 1 ? '' : 's'}</>}
      />

      <p className="mb-5 font-serif text-xl italic text-ink-soft">
        {boardVerdict(leader, pass, mode)}
      </p>

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-4">
        <Segmented
            label="Pass"
            value={pass ?? ALL}
            options={[
              { id: ALL, label: 'All' },
              ...PASS_IDS.map((p) => ({ id: p as string, label: PASS_LABELS[p] })),
            ]}
            onChange={(v) =>
              update({ pass: v === ALL ? null : (v as PassId), selectedId: null })
            }
          />
        <Segmented
            label="Rank by"
            value={mode}
            options={[
              { id: 'seasonal' as ScoreMode, label: 'Seasonal' },
              { id: 'live' as ScoreMode, label: 'Live GFS' },
            ]}
            onChange={(m) => update({ mode: m })}
          />
          <ShareLink label="Share" cardUrl={cardUrl} />
        </div>
        <Segmented
          label="Region"
          value={macro ?? ALL}
          options={[
            { id: ALL, label: 'All' },
            ...MACRO_IDS.map((m) => ({
              id: m as string,
              label: MACRO_LABELS[m],
              disabled: regionCounts[m] === 0,
            })),
          ]}
          onChange={(v) =>
            update({
              macro: v === ALL ? null : (v as MacroRegionId),
              selectedId: null,
              mode: null,
            })
          }
        />
      </div>

      <p className="mt-3 text-sm text-ink-soft">
        {pass ? `${PASS_BLURBS[pass]}.` : 'Every destination on both passes.'}{' '}
        {mode === 'seasonal' ? (
          <>
            Ranking on the <strong className="font-semibold">seasonal</strong> ENSO
            signal.
            {modeOverride === null &&
              (macro === null ? (
                <> Regions sit in opposite seasons, so a single live run cannot rank them together.</>
              ) : (
                autoMode === 'seasonal' && (
                  <> The 16-day forecast is dry everywhere, so there is nothing live to rank yet.</>
                )
              ))}
          </>
        ) : (
          <>
            Ranking on the <strong className="font-semibold">live GFS run</strong>, mixed
            65/35 with the seasonal signal so one model run does not decide the order.
          </>
        )}
      </p>

      {pass && (
        <div className="mt-5">
          <BlackoutDates pass={pass} />
        </div>
      )}

      {summary && !macro && (
        <div
          className={`mt-7 grid gap-x-12 gap-y-9 ${summary.regions.length > 0 ? 'lg:grid-cols-2' : ''}`}
        >
          {summary.regions.length > 0 && (
            <div>
              <p className="eyebrow mb-1 text-micro">The split · median score</p>
              <RegionSplit
                regions={summary.regions}
                pass={pass}
                mode={modeOverride}
                onSelect={(m) => update({ macro: m, selectedId: null, mode: null })}
              />
            </div>
          )}
          <div>
            <p className="eyebrow mb-1 text-micro">Best placed right now</p>
            <GlobalLeaders leaders={summary.leaders} limit={10} />
          </div>
        </div>
      )}

      {macro && (
      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="border border-rule bg-surface p-2">
            <ResortMap
              geometry={maps[macro]}
              points={points[macro]}
              scored={mapRows}
              mode={mode}
              selectedId={selectedId}
              onSelect={isBoard ? (id) => update({ selectedId: id }) : undefined}
            />
          </div>

          {isBoard && selected && (
            <div className="mt-4 border border-rule bg-surface p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-serif text-xl">{selected.resort.name}</h3>
                <p className="flex flex-wrap gap-x-4 font-mono text-meta uppercase tracking-wide">
                  <Link
                    href={`/resort/${selected.resort.id}`}
                    className="text-accent underline underline-offset-4"
                  >
                    Full page →
                  </Link>
                  <a
                    href={selected.resort.website}
                    target="_blank"
                    rel="noreferrer"
                    className="text-accent underline underline-offset-4"
                  >
                    Resort site ↗
                  </a>
                </p>
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
          {isBoard ? (
            <ResortTable
              scored={scored}
              mode={mode}
              selectedId={selectedId}
              onSelect={(id) => update({ selectedId: id })}
            />
          ) : (
            <>
              <p className="eyebrow mb-1.5 text-micro">Ranked · every pass</p>
              <ResortTable
                scored={regionRows}
                mode={mode}
                selectedId={selectedId}
                onSelect={(id) => update({ selectedId: id })}
              />
            </>
          )}
        </div>
      </div>
      )}
    </section>
  )
}
