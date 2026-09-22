'use client'

import { useMemo, useState } from 'react'
import type { Nino34Series } from '@/lib/enso'
import { EVENT_THRESHOLD, classifyPhase, classifyStrength } from '@/lib/enso-scale'
import { nino } from '@/lib/format'

const VIEW = { w: 1000, h: 200 }

/** One instance renders per page, so the clip ids need no uniqueness hook. */
const WARM_CLIP = 'nino34-warm'
const COOL_CLIP = 'nino34-cool'

const YEAR = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' })
const FULL_DATE = new Intl.DateTimeFormat('en-US', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

type Range = 'all' | '20' | '10' | '5' | '2'

const RANGES: { id: Range; label: string; years: number | null }[] = [
  { id: 'all', label: 'All', years: null },
  { id: '20', label: '20y', years: 20 },
  { id: '10', label: '10y', years: 10 },
  { id: '5', label: '5y', years: 5 },
  { id: '2', label: '2y', years: 2 },
]

const signed = (v: number) => `${v > 0 ? '+' : ''}${v.toFixed(1)}`

const DAY_MS = 86_400_000

/**
 * The Niño 3.4 record on a real time axis.
 *
 * @remarks
 * - Positioned by date, so a week the file ever skipped would show as a gap.
 * - Shaded past ±0.5 °C, which is where CPC names an El Niño or a La Niña.
 * - Zoom is a range control rather than a gesture, so it works on a phone.
 */
export default function Nino34Chart({ series }: { series: Nino34Series }) {
  const [range, setRange] = useState<Range>('all')
  const [hover, setHover] = useState<number | null>(null)

  const chart = useMemo(() => {
    const startMs = Date.parse(series.start)
    const stepMs = series.step * DAY_MS
    const at = (i: number) => startMs + i * stepMs

    const years = RANGES.find((r) => r.id === range)?.years
    const from = years
      ? Math.max(0, series.anomalies.length - Math.round((years * 365.25) / series.step))
      : 0

    const visible = series.anomalies.slice(from)
    const t0 = at(from)
    const span = Math.max(1, at(series.anomalies.length - 1) - t0)
    const lo = Math.min(-1, ...visible) - 0.3
    const hi = Math.max(1, ...visible) + 0.3

    const x = (i: number) => ((at(from + i) - t0) / span) * VIEW.w
    const y = (v: number) => VIEW.h - ((v - lo) / (hi - lo)) * VIEW.h

    const points = visible.map((v, i) => `${x(i).toFixed(1)} ${y(v).toFixed(1)}`)
    const line = `M${points.join('L')}`
    const area = `${line}L${VIEW.w.toFixed(1)} ${y(0).toFixed(1)}L0 ${y(0).toFixed(1)}Z`

    // Ticks thin out as the window widens, so the axis never crowds.
    const firstYear = new Date(t0).getUTCFullYear()
    const lastYear = new Date(at(series.anomalies.length - 1)).getUTCFullYear()
    const tickStep = lastYear - firstYear > 24 ? 5 : lastYear - firstYear > 8 ? 2 : 1
    const ticks: { year: number; left: number }[] = []
    for (let year = Math.ceil(firstYear / tickStep) * tickStep; year <= lastYear; year += tickStep) {
      const left = ((Date.UTC(year, 0, 1) - t0) / span) * 100
      if (left >= 0 && left <= 100) ticks.push({ year, left })
    }

    const peak = visible.reduce((best, v, i) => (v > visible[best] ? i : best), 0)

    return { from, visible, line, area, x, y, ticks, peak, at }
  }, [series, range])

  const { from, visible, line, area, x, y, ticks, peak, at } = chart
  const pct = (v: number) => (y(v) / VIEW.h) * 100
  const active = hover === null ? visible.length - 1 : hover
  const activeValue = visible[active]

  function track(clientX: number, target: HTMLElement) {
    const rect = target.getBoundingClientRect()
    const i = Math.round(((clientX - rect.left) / rect.width) * (visible.length - 1))
    setHover(Math.max(0, Math.min(visible.length - 1, i)))
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
        <div className="flex flex-col gap-1.5">
          <span className="eyebrow text-micro">{nino('Nino 3.4 · weekly anomaly')}</span>
          <span className="tnum font-mono text-meta text-ink-faint">
            {YEAR.format(at(from))}–{YEAR.format(at(series.anomalies.length - 1))} ·{' '}
            {visible.length} weeks · °C
          </span>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="eyebrow text-micro">Range</span>
          <div role="group" aria-label="Range" className="flex flex-wrap gap-1">
            {RANGES.map((r) => (
              <button
                key={r.id}
                type="button"
                aria-pressed={range === r.id}
                onClick={() => {
                  setRange(r.id)
                  setHover(null)
                }}
                className={`border px-2.5 py-1 font-mono text-micro uppercase tracking-wider transition-colors ${
                  range === r.id
                    ? 'border-ink bg-ink text-paper'
                    : 'border-rule bg-surface text-ink-soft hover:bg-surface-sunk'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div
        className="relative mt-2.5 touch-pan-y"
        onMouseMove={(e) => track(e.clientX, e.currentTarget)}
        onMouseLeave={() => setHover(null)}
        onTouchMove={(e) => track(e.touches[0].clientX, e.currentTarget)}
        onTouchEnd={() => setHover(null)}
      >
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          preserveAspectRatio="none"
          className="h-44 w-full"
          role="img"
          aria-label={nino(
            `Nino 3.4 weekly anomaly, ${YEAR.format(at(from))} to ${YEAR.format(at(series.anomalies.length - 1))}`,
          )}
        >
          <clipPath id={WARM_CLIP}>
            <rect x="0" y="0" width={VIEW.w} height={Math.max(0, y(EVENT_THRESHOLD))} />
          </clipPath>
          <clipPath id={COOL_CLIP}>
            <rect
              x="0"
              y={y(-EVENT_THRESHOLD)}
              width={VIEW.w}
              height={Math.max(0, VIEW.h - y(-EVENT_THRESHOLD))}
            />
          </clipPath>

          {ticks.map((t) => (
            <line
              key={t.year}
              x1={(t.left / 100) * VIEW.w}
              x2={(t.left / 100) * VIEW.w}
              y1="0"
              y2={VIEW.h}
              stroke="var(--rule)"
              strokeWidth={1}
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <path d={area} fill="var(--hot)" fillOpacity={0.85} clipPath={`url(#${WARM_CLIP})`} />
          <path d={area} fill="var(--cold)" fillOpacity={0.85} clipPath={`url(#${COOL_CLIP})`} />

          {[EVENT_THRESHOLD, -EVENT_THRESHOLD].map((v) => (
            <line
              key={v}
              x1="0"
              x2={VIEW.w}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--rule-strong)"
              strokeWidth={1}
              strokeDasharray="3 3"
              vectorEffect="non-scaling-stroke"
            />
          ))}

          <line
            x1="0"
            x2={VIEW.w}
            y1={y(0)}
            y2={y(0)}
            stroke="var(--ink-faint)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />

          <path
            d={line}
            fill="none"
            stroke="var(--ink)"
            strokeWidth={1}
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          <line
            x1={x(active)}
            x2={x(active)}
            y1="0"
            y2={VIEW.h}
            stroke="var(--accent)"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>

        <span
          className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent"
          style={{ left: `${(x(active) / VIEW.w) * 100}%`, top: `${pct(activeValue)}%` }}
        />

        <span
          className="eyebrow pointer-events-none absolute right-1 bg-paper px-1 text-micro"
          style={{ top: `${pct(EVENT_THRESHOLD)}%`, transform: 'translateY(-125%)' }}
        >
          {nino('El Nino')}
        </span>
        <span
          className="eyebrow pointer-events-none absolute right-1 bg-paper px-1 text-micro"
          style={{ top: `${pct(-EVENT_THRESHOLD)}%`, transform: 'translateY(25%)' }}
        >
          {nino('La Nina')}
        </span>
      </div>

      <div className="relative mt-1 h-4 border-t border-rule">
        {ticks.map((t) => (
          <span
            key={t.year}
            className="tnum absolute -translate-x-1/2 pt-1 font-mono text-micro text-ink-faint"
            style={{ left: `${t.left}%` }}
          >
            {t.year}
          </span>
        ))}
      </div>

      <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-micro">
        <span className="text-ink">
          {FULL_DATE.format(at(from + active))} ·{' '}
          <span className="tnum font-semibold">{signed(activeValue)} °C</span> ·{' '}
          {nino(
            classifyPhase(activeValue) === 'Neutral'
              ? 'Neutral'
              : `${classifyStrength(activeValue)} ${classifyPhase(activeValue)}`,
          )}
        </span>
        <span className="text-ink-faint">
          {nino(`Peak in view ${signed(visible[peak])} · ${FULL_DATE.format(at(from + peak))}`)}
        </span>
        {hover === null && <span className="text-ink-faint">Hover to read a week</span>}
      </p>
    </div>
  )
}
