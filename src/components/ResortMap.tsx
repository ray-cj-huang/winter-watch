'use client'

import { useId, useState } from 'react'
import type { MapGeometry, ProjectedPoint } from '@/lib/map-types'
import { VIEW_BOX } from '@/lib/map-types'
import { num } from '@/lib/format'
import { scoreColor } from '@/lib/palette'
import type { ScoredResort } from '@/lib/score'
import type { ScoreMode } from '@/lib/score'

interface Props {
  geometry: MapGeometry
  points: ProjectedPoint[]
  scored: ScoredResort[]
  mode: ScoreMode
  selectedId: string | null
  /** Omitted where the map is a locator rather than a control. */
  onSelect?: (id: string | null) => void
}

/** Dot radius grows with score so favored mountains read first. */
function radiusFor(score: number): number {
  return 4.5 + (Math.max(0, Math.min(100, score)) / 100) * 6.5
}

export default function ResortMap({
  geometry,
  points,
  scored,
  mode,
  selectedId,
  onSelect,
}: Props) {
  const [hovered, setHovered] = useState<string | null>(null)
  const clipId = useId()

  const byId = new Map(scored.map((s) => [s.resort.id, s]))
  // Draw low scores first so the favored dots land on top.
  const drawable = points
    .flatMap((p) => {
      const s = byId.get(p.id)
      return s ? [{ point: p, scored: s }] : []
    })
    .sort((a, b) => a.scored.score - b.scored.score)

  const active = hovered ?? selectedId
  const activeEntry = drawable.find((d) => d.point.id === active)

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${VIEW_BOX.width} ${VIEW_BOX.height}`}
        className="w-full h-auto"
        role="img"
        aria-label="Map of resorts coloured by forecast outlook"
      >
        <clipPath id={clipId}>
          <rect x="0" y="0" width={VIEW_BOX.width} height={VIEW_BOX.height} />
        </clipPath>
        <g clipPath={`url(#${clipId})`}>
          <path d={geometry.fill} fill="var(--surface-sunk)" stroke="none" />
          {geometry.borders && (
            <path
              d={geometry.borders}
              fill="none"
              stroke="var(--rule)"
              strokeWidth={0.6}
              vectorEffect="non-scaling-stroke"
            />
          )}
          {geometry.outline && (
            <path
              d={geometry.outline}
              fill="none"
              stroke="var(--rule-strong)"
              strokeWidth={0.9}
              vectorEffect="non-scaling-stroke"
            />
          )}

          {drawable.map(({ point, scored: s }) => {
            const isActive = point.id === active
            const r = radiusFor(s.score)
            return (
              <g
                key={point.id}
                transform={`translate(${point.x} ${point.y})`}
                onMouseEnter={() => setHovered(point.id)}
                onMouseLeave={() => setHovered(null)}
                onClick={() => onSelect?.(selectedId === point.id ? null : point.id)}
                className={onSelect ? 'cursor-pointer' : undefined}
              >
                <circle r={Math.max(r + 5, 16)} fill="transparent" />
                {isActive && (
                  <circle r={r + 5} fill="none" stroke="var(--ink)" strokeWidth={1.2} />
                )}
                <circle
                  r={r}
                  fill={scoreColor(s.score)}
                  fillOpacity={0.85}
                  stroke="var(--paper)"
                  strokeWidth={1.2}
                />
                {/* Native tooltip keeps the map usable for keyboard/screen readers. */}
                <title>{`${s.resort.name} — ${Math.round(s.score)}/100`}</title>
              </g>
            )
          })}
        </g>
      </svg>

      {activeEntry && (
        <>
          <MapCallout
            entry={activeEntry.scored}
            point={activeEntry.point}
            mode={mode}
          />
          <div className="mt-2 border border-rule bg-surface p-3 sm:hidden">
            <CalloutBody entry={activeEntry.scored} mode={mode} />
          </div>
        </>
      )}
    </div>
  )
}

function MapCallout({
  entry,
  point,
  mode,
}: {
  entry: ScoredResort
  point: ProjectedPoint
  mode: ScoreMode
}) {
  // Position as a percentage of the viewBox so it tracks the responsive SVG.
  const left = (point.x / VIEW_BOX.width) * 100
  const top = (point.y / VIEW_BOX.height) * 100
  const flipX = left > 62
  const flipY = top > 68

  return (
    <div
      className="pointer-events-none absolute z-10 hidden w-56 border border-rule bg-surface p-3 shadow-lg sm:block"
      style={{
        left: `${left}%`,
        top: `${top}%`,
        transform: `translate(${flipX ? 'calc(-100% - 14px)' : '14px'}, ${
          flipY ? 'calc(-100% - 14px)' : '14px'
        })`,
      }}
    >
      <CalloutBody entry={entry} mode={mode} />
    </div>
  )
}

/** Shared by the floating tooltip and the stacked mobile panel. */
function CalloutBody({ entry, mode }: { entry: ScoredResort; mode: ScoreMode }) {
  return (
    <>
      <p className="font-serif text-base leading-tight">{entry.resort.name}</p>
      <p className="eyebrow mt-0.5 text-micro">{entry.resort.locale}</p>
      <div className="mt-2 flex items-baseline gap-2">
        <span
          className="tnum font-mono text-2xl font-semibold leading-none"
          style={{ color: scoreColor(entry.score) }}
        >
          {Math.round(entry.score)}
        </span>
        <span className="text-xs text-ink-soft">{entry.verdict}</span>
      </div>
      {mode === 'live' && entry.forecast && (
        <p className="tnum mt-2 font-mono text-xs text-ink-soft">
          {entry.forecast.snowIn7d.toFixed(1)}&quot; next 7d
        </p>
      )}
      <p className="tnum mt-1 font-mono text-meta text-ink-faint">
        Base {num(entry.resort.baseElevationFt)} ft
      </p>
    </>
  )
}
