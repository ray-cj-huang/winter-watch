import type { Nino34Point } from '@/lib/enso'
import { nino } from '@/lib/format'

const VIEW = { w: 1000, h: 200 }

/** The anomaly either side of which CPC names an event. */
const THRESHOLD = 0.5

/** One instance renders per page, so the clip ids need no uniqueness hook. */
const WARM_CLIP = 'nino34-warm'
const COOL_CLIP = 'nino34-cool'

const YEAR = new Intl.DateTimeFormat('en-US', { year: 'numeric', timeZone: 'UTC' })
const MONTH_YEAR = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

/**
 * The Niño 3.4 record on a real time axis.
 *
 * @remarks
 * - Positioned by date, so the gaps between CPC weeks are honest.
 * - Shaded past ±0.5 °C, which is where an El Niño or La Niña is named.
 * - Rendered on the server: the series is long, the path string is not.
 */
export default function Nino34Trend({ history }: { history: Nino34Point[] }) {
  if (history.length < 2) return null

  const times = history.map((h) => Date.parse(h.week))
  const start = times[0]
  const span = times[times.length - 1] - start
  const values = history.map((h) => h.anomaly)
  const lo = Math.min(-3, ...values)
  const hi = Math.max(3, ...values)

  const x = (t: number) => ((t - start) / span) * VIEW.w
  const y = (v: number) => VIEW.h - ((v - lo) / (hi - lo)) * VIEW.h
  const pct = (v: number) => (y(v) / VIEW.h) * 100

  const points = history.map((h, i) => `${x(times[i]).toFixed(1)} ${y(h.anomaly).toFixed(1)}`)
  const line = `M${points.join('L')}`
  const area = `${line}L${VIEW.w.toFixed(1)} ${y(0).toFixed(1)}L0 ${y(0).toFixed(1)}Z`

  const latest = history[history.length - 1]
  const peak = history.reduce((a, b) => (b.anomaly > a.anomaly ? b : a))

  // A label every five years; one per year is unreadable across four decades.
  const ticks: { year: number; left: number }[] = []
  const lastYear = new Date(times[times.length - 1]).getUTCFullYear()
  for (let year = Math.ceil(new Date(start).getUTCFullYear() / 5) * 5; year <= lastYear; year += 5) {
    const at = Date.UTC(year, 0, 1)
    if (at >= start && at <= start + span) ticks.push({ year, left: (x(at) / VIEW.w) * 100 })
  }

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="eyebrow text-micro">{nino('Nino 3.4 · weekly anomaly')}</span>
        <span className="tnum font-mono text-meta text-ink-faint">
          {YEAR.format(start)}–{YEAR.format(times[times.length - 1])} · °C
        </span>
      </div>

      <div className="relative mt-2">
        <svg
          viewBox={`0 0 ${VIEW.w} ${VIEW.h}`}
          preserveAspectRatio="none"
          className="h-44 w-full"
          role="img"
          aria-label={nino(
            `Nino 3.4 weekly anomaly from ${YEAR.format(start)} to ${YEAR.format(times[times.length - 1])}`,
          )}
        >
          <clipPath id={WARM_CLIP}>
            <rect x="0" y="0" width={VIEW.w} height={y(THRESHOLD)} />
          </clipPath>
          <clipPath id={COOL_CLIP}>
            <rect x="0" y={y(-THRESHOLD)} width={VIEW.w} height={VIEW.h - y(-THRESHOLD)} />
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

          {[THRESHOLD, -THRESHOLD].map((v) => (
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
        </svg>

        <span
          className="eyebrow pointer-events-none absolute right-1 bg-paper px-1 text-micro"
          style={{ top: `${pct(THRESHOLD)}%`, transform: 'translateY(-125%)' }}
        >
          {nino('El Nino')}
        </span>
        <span
          className="eyebrow pointer-events-none absolute right-1 bg-paper px-1 text-micro"
          style={{ top: `${pct(-THRESHOLD)}%`, transform: 'translateY(25%)' }}
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

      <p className="mt-2 font-mono text-micro text-ink-faint">
        {nino(
          `Peak ${peak.anomaly > 0 ? '+' : ''}${peak.anomaly.toFixed(1)} in ${MONTH_YEAR.format(Date.parse(peak.week))} · now ${latest.anomaly > 0 ? '+' : ''}${latest.anomaly.toFixed(1)}`,
        )}
      </p>
    </div>
  )
}
