'use client'

import { num } from '@/lib/format'
import { scoreColor } from '@/lib/palette'
import type { ScoredResort, ScoreMode } from '@/lib/score'
import type { Access } from '@/lib/types'

function accessLabel(a: Access): string {
  if (a.kind === 'unlimited') return a.blackouts ? 'Unlimited · blackouts' : 'Unlimited'
  return `${a.days} days${a.blackouts ? ' · blackouts' : ''}`
}

function Row({
  entry,
  rank,
  mode,
  selected,
  onSelect,
}: {
  entry: ScoredResort
  rank: number
  mode: ScoreMode
  selected: boolean
  onSelect: () => void
}) {
  const { resort, access, forecast } = entry
  const unlimited = access.kind === 'unlimited'

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        className={`grid w-full grid-cols-[2rem_1fr_auto] items-center gap-x-3 gap-y-1 border-l-2 px-3 py-3 text-left transition-colors sm:grid-cols-[2rem_minmax(0,1fr)_7rem_4.5rem] ${
          selected ? 'bg-surface-sunk' : 'bg-surface hover:bg-surface-sunk/60'
        }`}
        style={{ borderLeftColor: scoreColor(entry.score) }}
      >
        <span className="tnum self-start font-mono text-xs text-ink-faint">
          {String(rank).padStart(2, '0')}
        </span>

        <span className="min-w-0">
          <span className="block truncate font-medium">{resort.name}</span>
          <span className="block truncate font-mono text-[0.68rem] text-ink-faint">
            {resort.locale}
            {resort.country !== 'USA' &&
              resort.country !== resort.locale &&
              ` · ${resort.country}`}
          </span>
          <span
            className={`mt-1 inline-block font-mono text-[0.66rem] uppercase tracking-[0.05em] ${
              unlimited ? 'text-cool' : 'text-ink-faint'
            }`}
          >
            {accessLabel(access)}
          </span>
          {access.note && (
            <span className="mt-0.5 block text-[0.7rem] leading-snug text-ink-faint">
              {access.note}
            </span>
          )}
        </span>

        {/* Forecast column: only meaningful once there is snow in the model. */}
        <span className="hidden text-right sm:block">
          {mode === 'live' && forecast ? (
            <>
              <span className="tnum block font-mono text-sm">
                {forecast.snowIn7d.toFixed(1)}&quot;
              </span>
              <span className="block font-mono text-[0.62rem] uppercase tracking-wide text-ink-faint">
                next 7d
              </span>
              {forecast.rainRiskDays > 0 && (
                <span className="tnum mt-0.5 block font-mono text-[0.62rem] text-warm">
                  {forecast.rainRiskDays} rain-risk d
                </span>
              )}
            </>
          ) : (
            <>
              <span className="tnum block font-mono text-sm text-ink-soft">
                {num(resort.baseElevationFt)}
              </span>
              <span className="block font-mono text-[0.62rem] uppercase tracking-wide text-ink-faint">
                ft base
              </span>
            </>
          )}
        </span>

        <span className="justify-self-end text-right">
          <span
            className="tnum block font-mono text-xl font-semibold leading-none"
            style={{ color: scoreColor(entry.score) }}
          >
            {Math.round(entry.score)}
          </span>
          <span className="mt-1 block font-mono text-[0.6rem] uppercase tracking-wide text-ink-faint">
            {entry.verdict}
          </span>
        </span>
      </button>
    </li>
  )
}

export default function ResortTable({
  scored,
  mode,
  selectedId,
  onSelect,
}: {
  scored: ScoredResort[]
  mode: ScoreMode
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  if (scored.length === 0) {
    return (
      <p className="border border-rule bg-surface p-6 text-sm text-ink-soft">
        No resorts on this pass in this region.
      </p>
    )
  }

  return (
    <ol className="flex flex-col gap-px border border-rule bg-rule">
      {scored.map((entry, i) => (
        <Row
          key={entry.resort.id}
          entry={entry}
          rank={i + 1}
          mode={mode}
          selected={selectedId === entry.resort.id}
          onSelect={() => onSelect(selectedId === entry.resort.id ? null : entry.resort.id)}
        />
      ))}
    </ol>
  )
}
