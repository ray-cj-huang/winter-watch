import { BLACKOUT_DATES } from '@/lib/resorts'
import type { PassId } from '@/lib/types'
import { PASS_LABELS } from '@/lib/view-state'

/** The holiday calendar a tier honours, or nothing where that tier has none. */
export default function BlackoutDates({ pass }: { pass: PassId }) {
  const dates = BLACKOUT_DATES[pass]
  if (!dates) return null

  return (
    <div className="border border-rule bg-surface p-4">
      <p className="eyebrow mb-2 text-micro">
        {PASS_LABELS[pass]} blackout dates · Northern Hemisphere
      </p>
      <ul className="flex flex-wrap gap-2">
        {dates.map((b) => (
          <li
            key={b.range}
            className="tnum rounded-sm border border-rule-strong px-2.5 py-1 font-mono text-meta text-ink-soft"
          >
            {b.range} <span className="text-ink-faint">· {b.label}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
