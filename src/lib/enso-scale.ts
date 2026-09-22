export type EnsoPhase = 'La Nina' | 'Neutral' | 'El Nino'
export type EnsoStrength = 'Neutral' | 'Weak' | 'Moderate' | 'Strong' | 'Very Strong'

/** The anomaly either side of which CPC names an event. */
export const EVENT_THRESHOLD = 0.5

export function classifyStrength(nino34: number): EnsoStrength {
  const a = Math.abs(nino34)
  if (a < EVENT_THRESHOLD) return 'Neutral'
  if (a < 1.0) return 'Weak'
  if (a < 1.5) return 'Moderate'
  if (a < 2.0) return 'Strong'
  return 'Very Strong'
}

export function classifyPhase(nino34: number): EnsoPhase {
  if (nino34 >= EVENT_THRESHOLD) return 'El Nino'
  if (nino34 <= -EVENT_THRESHOLD) return 'La Nina'
  return 'Neutral'
}
