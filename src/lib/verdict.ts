import type { EnsoState } from './enso'
import { nino, num } from './format'
import { SCORE_BANDS } from './palette'
import type { ScoredResort, ScoreMode } from './score'
import type { PassId } from './types'
import { PASS_LABELS } from './view-state'

/** Same threshold the map colours by, so a sentence never praises a red dot. */
const FAVORED = SCORE_BANDS[0].min

/**
 * One-sentence read on a ranked board, shared by the page and the share card.
 *
 * @remarks
 * - Names the leader rather than the score: a name travels, a number does not.
 * - Says plainly when nothing clears the band instead of dressing up a leader.
 */
export function boardVerdict(
  top: ScoredResort | undefined,
  pass: PassId,
  mode: ScoreMode,
): string {
  if (!top) return `No destinations on the ${PASS_LABELS[pass]} pass in this region.`

  const where = `on the ${PASS_LABELS[pass]} pass`
  if (top.score < FAVORED) {
    return `Nothing ${where} is clearly favored right now. ${top.resort.name} leads at ${Math.round(top.score)}.`
  }
  return mode === 'live'
    ? `The live GFS run puts ${top.resort.name} ahead ${where}.`
    : `The pattern favors ${top.resort.name} ${where} right now.`
}

/**
 * Why the model places one resort where it does.
 *
 * @remarks
 * - Reads the two factors the score is built from, not the score itself.
 * - Both are already on `ScoredResort` and were previously never shown.
 */
export function resortRationale(entry: ScoredResort, enso: EnsoState): string {
  const { resort, ensoEffect, elevationResilience } = entry
  const event =
    enso.phase === 'Neutral'
      ? 'a neutral ocean'
      : nino(`a ${enso.strength.toLowerCase()} ${enso.phase}`)

  const teleconnection =
    ensoEffect > 0.15
      ? `Past composites put ${resort.name} on the favored side of ${event}.`
      : ensoEffect < -0.15
        ? `Past composites put ${resort.name} on the dry side of ${event}.`
        : `${resort.name} has no strong historical lean under ${event}.`

  const base = `${num(resort.baseElevationFt)} ft base`
  const elevation =
    elevationResilience > 0.6
      ? `Its ${base} keeps most of what falls as snow.`
      : elevationResilience < 0.35
        ? `Its ${base} is low enough that a warm storm arrives as rain.`
        : `Its ${base} absorbs a rising snow line only so far.`

  return `${teleconnection} ${elevation}`
}
