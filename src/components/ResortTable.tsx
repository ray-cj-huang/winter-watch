'use client'

import { useMemo, useState } from 'react'
import { SCORE_BANDS, scoreColor, type ScoreLabel } from '@/lib/palette'
import type { ScoreMode } from '@/lib/score'
import type { Access, Resort, Score } from '@/lib/types'
import type { ResortForecast } from '@/lib/forecast'

/** A row of the table. Access is absent when no tier has been chosen. */
export interface TableResort {
  resort: Resort
  score: Score
  verdict: ScoreLabel
  forecast?: ResortForecast | null
  access?: Access
  /** Stands in for the access glyph where there is no tier to report. */
  tag?: string
}

/**
 * Access compressed to a glyph so a row stays on one line.
 *
 * @remarks
 * `∞` unlimited, `5d`/`7d` day-capped, `*` holiday blackouts apply.
 */
function accessGlyph(a: Access): string {
  const base = a.kind === 'unlimited' ? '∞' : `${a.days}d`
  return a.blackouts ? `${base}*` : base
}

function accessTitle(a: Access): string {
  const base = a.kind === 'unlimited' ? 'Unlimited days' : `${a.days} days`
  return `${base}${a.blackouts ? ', holiday blackouts apply' : ', no blackouts'}`
}

function Row({
  entry,
  rank,
  mode,
  selected,
  onSelect,
}: {
  entry: TableResort
  rank: number
  mode: ScoreMode
  selected: boolean
  onSelect: () => void
}) {
  const { resort, access, forecast } = entry
  const generous = access?.kind === 'unlimited' && !access.blackouts

  // Secondary column carries whatever is most useful in the current mode.
  const aside =
    mode === 'live' && forecast ? `${forecast.snowIn7d.toFixed(1)}"` : null

  return (
    <li>
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={selected}
        title={resort.locale + (access?.note ? ` — ${access.note}` : '')}
        className={`grid w-full grid-cols-[1.7rem_minmax(0,1fr)_2.6rem_2.4rem] items-baseline gap-x-2.5 border-l-2 px-2.5 py-1.5 text-left transition-colors sm:grid-cols-[1.7rem_minmax(0,1fr)_3.2rem_2.6rem_2.4rem] ${
          selected ? 'bg-surface-sunk' : 'bg-surface hover:bg-surface-sunk/60'
        }`}
        style={{ borderLeftColor: scoreColor(entry.score) }}
      >
        <span className="tnum font-mono text-meta text-ink-faint">
          {String(rank).padStart(2, '0')}
        </span>

        <span className="min-w-0 truncate text-sm font-medium">
          {resort.name}
          {access?.note && (
            <span className="ml-1 align-super text-micro text-ink-faint">†</span>
          )}
          <span className="ml-1.5 font-mono text-meta font-normal text-ink-faint">
            {resort.locale}
          </span>
        </span>

        {/* Live snowfall only earns a column when there is snow to show. */}
        <span className="tnum hidden text-right font-mono text-meta text-ink-soft sm:block">
          {aside}
        </span>

        <span
          className={`tnum text-right font-mono text-meta ${
            generous ? 'font-semibold text-cool' : 'text-ink-faint'
          }`}
          title={access ? accessTitle(access) : undefined}
        >
          {access ? accessGlyph(access) : entry.tag}
        </span>

        <span
          className="tnum text-right font-mono text-base font-semibold"
          style={{ color: scoreColor(entry.score) }}
        >
          {Math.round(entry.score)}
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
  scored: TableResort[]
  mode: ScoreMode
  selectedId: string | null
  onSelect: (id: string | null) => void
}) {
  // Null until touched, so the default can follow the data: a region with
  // nothing favored would otherwise render every band collapsed.
  const [open, setOpen] = useState<ReadonlySet<ScoreLabel> | null>(null)

  // Rank is assigned before bucketing, so numbering stays one continuous
  // ranking across groups rather than restarting in each.
  const groups = useMemo(() => {
    const ranked = scored.map((entry, i) => ({ entry, rank: i + 1 }))
    return SCORE_BANDS.map((band) => ({
      label: band.label,
      varName: band.varName,
      items: ranked.filter((r) => r.entry.verdict === band.label),
    })).filter((g) => g.items.length > 0)
  }, [scored])

  if (scored.length === 0) {
    return (
      <p className="border border-rule bg-surface p-6 text-sm text-ink-soft">
        Nothing on this tier in this region.
      </p>
    )
  }

  // The best band present is open; the rest collapse to one line each.
  const fallback: ReadonlySet<ScoreLabel> = new Set(groups.slice(0, 1).map((g) => g.label))
  const openSet = open ?? fallback

  const toggle = (label: ScoreLabel) =>
    setOpen((prev) => {
      const next = new Set(prev ?? fallback)
      if (next.has(label)) next.delete(label)
      else next.add(label)
      return next
    })

  return (
    <div>
      {groups.map((group) => {
        const isOpen = openSet.has(group.label)
        const panelId = `group-${group.label.replace(/\s+/g, '-').toLowerCase()}`
        return (
          <section key={group.label} className="mb-1.5 last:mb-0">
            <h3>
              <button
                type="button"
                onClick={() => toggle(group.label)}
                aria-expanded={isOpen}
                aria-controls={panelId}
                className="flex w-full items-baseline gap-2 border-b border-rule py-1 text-left transition-colors hover:border-rule-strong"
              >
                <span
                  aria-hidden
                  className={`font-mono text-micro text-ink-faint transition-transform ${
                    isOpen ? 'rotate-90' : ''
                  }`}
                >
                  ▸
                </span>
                <span
                  className="inline-block h-2 w-2 shrink-0 translate-y-[1px] rounded-full"
                  style={{ background: `var(${group.varName})` }}
                />
                <span className="font-mono text-meta uppercase tracking-widest">
                  {group.label}
                </span>
                <span className="tnum font-mono text-meta text-ink-faint">
                  {group.items.length}
                </span>
                {/* Collapsed groups name their contents inline, on the same line. */}
                {!isOpen && (
                  <span className="min-w-0 flex-1 truncate text-right text-meta text-ink-faint">
                    {group.items.map((i) => i.entry.resort.name).join(' · ')}
                  </span>
                )}
              </button>
            </h3>

            {isOpen && (
              <ol id={panelId} className="flex flex-col gap-px bg-rule">
                {group.items.map(({ entry, rank }) => (
                  <Row
                    key={entry.resort.id}
                    entry={entry}
                    rank={rank}
                    mode={mode}
                    selected={selectedId === entry.resort.id}
                    onSelect={() =>
                      onSelect(selectedId === entry.resort.id ? null : entry.resort.id)
                    }
                  />
                ))}
              </ol>
            )}
          </section>
        )
      })}

      {scored.some((s) => s.access) && (
        <p className="mt-2.5 font-mono text-micro text-ink-faint">
          ∞ unlimited · * blackouts · † caveat
        </p>
      )}
    </div>
  )
}
