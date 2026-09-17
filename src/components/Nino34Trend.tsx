import { nino } from '@/lib/format'
import { anomalyColor } from '@/lib/palette'

const MONTH = new Intl.DateTimeFormat('en-US', { month: 'short', timeZone: 'UTC' })
const DAY = new Intl.DateTimeFormat('en-US', { day: 'numeric', timeZone: 'UTC' })

/**
 * The trailing weeks of Niño 3.4, drawn from a zero baseline.
 *
 * @remarks
 * - Direction is the point: one week says nothing about where this is going.
 * - Columns, not a line, so it shares the diverging scale with the bars above.
 */
export default function Nino34Trend({
  history,
}: {
  history: { week: string; anomaly: number }[]
}) {
  if (history.length < 2) return null

  const values = history.map((h) => h.anomaly)
  const lo = Math.min(0, ...values)
  const hi = Math.max(0.5, ...values)
  const span = hi - lo
  const zeroPct = ((0 - lo) / span) * 100

  const weeks = history.map((h, i) => {
    const month = MONTH.format(new Date(h.week))
    return {
      ...h,
      day: DAY.format(new Date(h.week)),
      // Label the month only where it turns over, so the axis reads as a timeline.
      month: i === 0 || month !== MONTH.format(new Date(history[i - 1].week)) ? month : null,
      latest: i === history.length - 1,
    }
  })

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <span className="eyebrow text-micro">{nino('Nino 3.4 · weekly anomaly')}</span>
        <span className="tnum font-mono text-meta text-ink-faint">
          {history.length} weeks · °C
        </span>
      </div>

      <div className="relative mt-2 flex h-20 items-stretch gap-[3px]">
        <span
          className="absolute left-0 right-0 h-px bg-rule-strong"
          style={{ bottom: `${zeroPct}%` }}
        />
        {weeks.map((w) => {
          const heightPct = (Math.abs(w.anomaly) / span) * 100
          return (
            <span
              key={w.week}
              title={`${w.month ?? ''} ${w.day}: ${w.anomaly > 0 ? '+' : ''}${w.anomaly.toFixed(1)} °C`}
              className="relative flex-1"
            >
              <span
                className="absolute left-0 right-0 min-h-[2px]"
                style={{
                  bottom: `${w.anomaly >= 0 ? zeroPct : zeroPct - heightPct}%`,
                  height: `${heightPct}%`,
                  background: anomalyColor(w.anomaly),
                }}
              />
            </span>
          )
        })}
      </div>

      <div className="mt-1.5 flex gap-[3px] border-t border-rule pt-1">
        {weeks.map((w) => (
          <span
            key={w.week}
            className={`tnum flex-1 font-mono text-micro ${w.latest ? 'font-semibold text-ink' : 'text-ink-faint'}`}
          >
            {w.day}
          </span>
        ))}
      </div>
      <div className="flex gap-[3px]">
        {weeks.map((w) => (
          <span key={w.week} className="eyebrow flex-1 text-micro">
            {w.month}
          </span>
        ))}
      </div>
    </div>
  )
}
