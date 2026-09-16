/**
 * One scale, used by the map, the table and the legend so a colour always
 * means the same thing. Cold = favored, hot = on the dry side of the split.
 */
export const SCORE_BANDS = [
  { min: 70, label: 'Favored', varName: '--cold' },
  { min: 58, label: 'Leaning favorable', varName: '--cool' },
  { min: 45, label: 'Neutral', varName: '--neutral-anom' },
  { min: 32, label: 'Leaning unfavorable', varName: '--warm' },
  { min: -Infinity, label: 'Unfavorable', varName: '--hot' },
] as const

export function scoreColor(score: number): string {
  const band = SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
  return `var(${band.varName})`
}

export function scoreLabel(score: number): string {
  const band = SCORE_BANDS.find((b) => score >= b.min) ?? SCORE_BANDS[SCORE_BANDS.length - 1]
  return band.label
}

/** Anomaly colour for the Nino-region bars. */
export function anomalyColor(anomaly: number): string {
  if (anomaly >= 2) return 'var(--hot)'
  if (anomaly >= 1) return 'var(--warm)'
  if (anomaly > -1) return 'var(--neutral-anom)'
  if (anomaly > -2) return 'var(--cool)'
  return 'var(--cold)'
}
