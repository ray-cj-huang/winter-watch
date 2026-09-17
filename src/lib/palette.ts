import type { Score } from './types'

/**
 * One scale, used by the map, the table and the legend so a colour always
 * means the same thing. Cold = favored, hot = on the dry side of the split.
 */
export const SCORE_BANDS = [
  { min: 60, label: 'Favored', varName: '--cold' },
  { min: 38, label: 'Neutral', varName: '--neutral-anom' },
  { min: -Infinity, label: 'Unfavorable', varName: '--hot' },
] as const

export type ScoreLabel = (typeof SCORE_BANDS)[number]['label']

const bandFor = (score: Score) =>
  SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]

export function scoreColor(score: Score): string {
  return `var(${bandFor(score).varName})`
}

export function scoreLabel(score: Score): ScoreLabel {
  return bandFor(score).label
}

/** Anomaly colour for the Nino-region bars. */
export function anomalyColor(anomaly: number): string {
  if (anomaly >= 2) return 'var(--hot)'
  if (anomaly >= 1) return 'var(--warm)'
  if (anomaly > -1) return 'var(--neutral-anom)'
  if (anomaly > -2) return 'var(--cool)'
  return 'var(--cold)'
}
