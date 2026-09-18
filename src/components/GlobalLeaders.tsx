import Link from 'next/link'
import { scoreColor } from '@/lib/palette'
import type { RankedResort } from '@/lib/summary'

/** The best-placed mountains, whichever pass reaches them. */
export default function GlobalLeaders({
  leaders,
  limit,
}: {
  leaders: RankedResort[]
  limit?: number
}) {
  return (
    <ol className="flex flex-col">
      {(limit ? leaders.slice(0, limit) : leaders).map((l, i) => (
        <li key={l.resort.id} className="border-t border-rule last:border-b">
          <Link
            href={`/resort/${l.resort.id}`}
            className="flex items-baseline gap-3 px-1 py-2.5 transition-colors hover:bg-surface"
          >
            <span className="tnum w-5 shrink-0 font-mono text-micro text-ink-faint">
              {i + 1}
            </span>
            <span className="min-w-0 truncate font-serif text-base leading-tight">
              {l.resort.name}
            </span>
            <span className="hidden shrink-0 font-mono text-micro text-ink-faint sm:inline">
              {l.resort.locale}
            </span>
            <span className="ml-auto shrink-0 font-mono text-micro text-ink-faint">
              {l.families.join(' · ')}
            </span>
            <span
              className="tnum w-8 shrink-0 text-right font-mono text-base leading-none"
              style={{ color: scoreColor(l.score) }}
            >
              {Math.round(l.score)}
            </span>
          </Link>
        </li>
      ))}
    </ol>
  )
}
