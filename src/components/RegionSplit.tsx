import Link from 'next/link'
import { scoreColor } from '@/lib/palette'
import type { ScoreMode } from '@/lib/score'
import type { RegionStanding } from '@/lib/summary'
import type { PassId } from '@/lib/types'
import { viewStatePath } from '@/lib/view-state'

/** How each region sits: one bar, one number, one line of context. */
export default function RegionSplit({
  regions,
  pass,
  mode,
}: {
  regions: RegionStanding[]
  pass: PassId | null
  mode: ScoreMode | null
}) {
  return (
    <ol className="flex flex-col">
      {regions.map((r) => (
        <li key={r.macro} className="border-t border-rule last:border-b">
          <Link
            href={viewStatePath({ pass, macro: r.macro, mode, selectedId: null })}
            className="block px-1 py-3.5 transition-colors hover:bg-surface"
          >
            <div className="flex items-baseline justify-between gap-4">
              <span className="font-serif text-lg leading-tight">{r.label}</span>
              <span
                className="tnum font-mono text-lg leading-none"
                style={{ color: scoreColor(r.median) }}
              >
                {Math.round(r.median)}
              </span>
            </div>

            <div className="mt-2.5 h-[3px] w-full bg-surface-sunk">
              <div
                className="h-full"
                style={{ width: `${r.median}%`, background: scoreColor(r.median) }}
              />
            </div>

            <p className="mt-1.5 font-mono text-micro text-ink-faint">
              {r.count} destination{r.count === 1 ? '' : 's'} · {r.leader.resort.name} leads
              at {Math.round(r.leader.score)}
            </p>
          </Link>
        </li>
      ))}
    </ol>
  )
}
