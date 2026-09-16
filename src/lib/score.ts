import type { EnsoState } from './enso'
import type { ResortForecast } from './forecast'
import { scoreLabel } from './palette'
import type { Access, PassId, Resort } from './types'

export type ScoreMode = 'seasonal' | 'live'

export interface ScoredResort {
  resort: Resort
  forecast: ResortForecast | null
  /** 0-100. ENSO teleconnection + elevation resilience + snow climatology. */
  seasonalScore: number
  /** 0-100 from the live GFS run, or null when there is nothing to forecast. */
  liveScore: number | null
  /** The score the current mode ranks on. */
  score: number
  /** Signed teleconnection effect in [-1, 1] before elevation adjustments. */
  ensoEffect: number
  /** 0-1, how well the mountain's elevation absorbs a warm winter. */
  elevationResilience: number
  /**
   * Plain-language read on `score`. Deliberately derived from the same value
   * the map colours by, so a red dot is never labelled "Favored".
   */
  verdict: string
  access: Access
}

const clamp = (n: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, n))
const norm = (v: number, lo: number, hi: number) => clamp((v - lo) / (hi - lo), 0, 1)

/**
 * How strongly the canonical ENSO teleconnection is expressed this year.
 *
 * Magnitude scales the signal; eastern-Pacific events express it more
 * sharply, because an EP-loaded subtropical jet is exactly the mechanism
 * that wets the southern tier and starves the north.
 */
export function teleconnectionGain(enso: EnsoState): number {
  const flavorGain = 0.7 + 0.6 * enso.epGradient
  const sign = enso.phase === 'La Nina' ? -1 : 1
  return sign * enso.magnitude * flavorGain
}

/**
 * Elevation resilience in [0, 1].
 *
 * El Nino winters run warm, so the snow line -- not the storm count -- is
 * usually the binding constraint. Base elevation matters more than summit,
 * because a high summit above a rainy base still means a rainy ski day.
 */
export function elevationResilience(r: Resort): number {
  const base = norm(r.baseElevationFt, 2000, 9500)
  const summit = norm(r.summitElevationFt, 4000, 13000)
  return 0.65 * base + 0.35 * summit
}

export function seasonalScore(r: Resort, enso: EnsoState): { score: number; effect: number } {
  const effect = clamp(r.ensoSensitivity * teleconnectionGain(enso), -1, 1)
  const resilience = elevationResilience(r)

  // Teleconnection is the backbone: -1 -> 0, 0 -> 50, +1 -> 100.
  let score = 50 + 50 * effect

  // Warm-storm penalty. Scales with event magnitude and with how little
  // elevation the mountain has to absorb a rising snow line.
  score -= enso.magnitude * (1 - resilience) * 18

  // Climatological baseline: a favored mediocre snow year at a 600 in
  // mountain still beats a favored year somewhere that averages 100 in.
  score += (norm(r.avgAnnualSnowIn, 90, 600) - 0.5) * 12

  return { score: clamp(score, 0, 100), effect }
}

/**
 * Near-term score from the live GFS run. Returns null when the model shows
 * essentially nothing anywhere -- in the preseason that is a true signal
 * about the calendar, not about the mountain, so we fall back to seasonal.
 */
export function liveScore(f: ResortForecast | null): number | null {
  if (!f) return null
  // 24 in over 7 days is a very good week; treat that as the ceiling.
  const snow = norm(f.snowIn7d, 0, 24) * 78
  const depth = norm(f.snowIn16d, 0, 48) * 22
  const rainPenalty = clamp(f.rainRiskDays * 3, 0, 22)
  return clamp(snow + depth - rainPenalty, 0, 100)
}

/**
 * Decide whether there is enough snow in the model to rank on live data.
 *
 * Scoped to the resorts actually being displayed: in the northern preseason
 * every US grid point reads zero, and a Southern Hemisphere resort in the
 * middle of its own winter must not drag the US view into live mode.
 */
export function pickMode(
  resorts: Resort[],
  forecasts: Record<string, ResortForecast>,
): ScoreMode {
  const best = resorts.reduce(
    (m, r) => Math.max(m, forecasts[r.id]?.snowIn7d ?? 0),
    0,
  )
  return best >= 6 ? 'live' : 'seasonal'
}

export function scoreResorts(
  resorts: Resort[],
  pass: PassId,
  enso: EnsoState,
  forecasts: Record<string, ResortForecast>,
  mode: ScoreMode,
): ScoredResort[] {
  const scored = resorts.flatMap((resort) => {
    const access = resort.access[pass]
    if (!access) return []

    const forecast = forecasts[resort.id] ?? null
    const { score: seasonal, effect } = seasonalScore(resort, enso)
    const live = liveScore(forecast)

    // In live mode the model run leads but the seasonal pattern still
    // carries weight -- a single GFS run is not a winter.
    const score =
      mode === 'live' && live !== null ? live * 0.65 + seasonal * 0.35 : seasonal

    return [
      {
        resort,
        forecast,
        seasonalScore: seasonal,
        liveScore: live,
        score,
        ensoEffect: effect,
        elevationResilience: elevationResilience(resort),
        verdict: scoreLabel(score),
        access,
      } satisfies ScoredResort,
    ]
  })

  return scored.sort((a, b) => b.score - a.score)
}
