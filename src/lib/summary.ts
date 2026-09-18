import type { EnsoState } from './enso'
import type { ResortForecast } from './forecast'
import { MACRO_LABELS } from './map-types'
import { scoreLabel, type ScoreLabel } from './palette'
import { RESORTS } from './resorts'
import { blendScore, liveScore, seasonalScore, type ScoreMode } from './score'
import type { MacroRegionId, PassId, Resort, Score } from './types'
import { MACRO_IDS } from './view-state'

/** A pass, not one of its tiers: two badges read where four would clutter. */
export type PassFamily = 'Ikon' | 'Epic'

/** Which passes reach a mountain at all, whatever the tier. */
export function passFamilies(resort: Resort): PassFamily[] {
  const families: PassFamily[] = []
  if (resort.access.ikon || resort.access['ikon-base']) families.push('Ikon')
  if (resort.access.epic || resort.access['epic-local']) families.push('Epic')
  return families
}

export interface RankedResort {
  resort: Resort
  score: Score
  verdict: ScoreLabel
  families: PassFamily[]
}

export interface RegionStanding {
  macro: MacroRegionId
  label: string
  count: number
  /** The region's own standing. One strong mountain does not carry a region. */
  median: Score
  leader: RankedResort
}

export interface Summary {
  /** Empty once a region is chosen, where a one-row split says nothing. */
  regions: RegionStanding[]
  /** Every resort in the pool, best first. Callers cut it to length. */
  leaders: RankedResort[]
  count: number
}

function rank(
  resorts: Resort[],
  enso: EnsoState,
  forecasts: Record<string, ResortForecast>,
  mode: ScoreMode,
): RankedResort[] {
  return resorts
    .map((resort) => {
      const { score: seasonal } = seasonalScore(resort, enso)
      const score = blendScore(seasonal, liveScore(forecasts[resort.id] ?? null), mode)
      return { resort, score, verdict: scoreLabel(score), families: passFamilies(resort) }
    })
    .sort((a, b) => b.score - a.score)
}

function median(values: Score[]): Score {
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

/**
 * The landing view: how each region sits, and what leads overall.
 *
 * @remarks
 * - Scoring never reads a tier, so an unset pass simply widens the pool.
 * - Needs no map, which is why an unset region can be rendered at all.
 */
export function summarise(
  enso: EnsoState,
  forecasts: Record<string, ResortForecast>,
  mode: ScoreMode,
  pass: PassId | null,
  macro: MacroRegionId | null,
): Summary {
  const pool = RESORTS.filter(
    (r) => (!pass || r.access[pass]) && (!macro || r.macro === macro),
  )
  const ranked = rank(pool, enso, forecasts, mode)

  const regions = macro
    ? []
    : MACRO_IDS.flatMap((m) => {
        const inRegion = ranked.filter((r) => r.resort.macro === m)
        if (inRegion.length === 0) return []
        return [
          {
            macro: m,
            label: MACRO_LABELS[m],
            count: inRegion.length,
            median: median(inRegion.map((r) => r.score)),
            leader: inRegion[0],
          } satisfies RegionStanding,
        ]
      })

  return { regions, leaders: ranked, count: ranked.length }
}
