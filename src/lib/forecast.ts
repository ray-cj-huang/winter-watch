import { cacheLife, cacheTag } from 'next/cache'
import { RESORTS } from './resorts'
import type { Resort } from './types'

/** Open-Meteo is a delivery layer; the numbers are NOAA GFS. */
const GFS_ENDPOINT = 'https://api.open-meteo.com/v1/gfs'

/** Points per request. 84 resorts -> 4 round trips, well under URL limits. */
const CHUNK = 25
const FORECAST_DAYS = 16

const CM_TO_IN = 0.393701
const MM_TO_IN = 0.0393701

export interface DailyPoint {
  date: string
  snowIn: number
  precipIn: number
  highC: number
  lowC: number
}

export interface ResortForecast {
  resortId: string
  /** Model grid elevation in metres -- often below the summit, so totals skew low. */
  modelElevationM: number
  daily: DailyPoint[]
  /** Totals over the full 16-day window. */
  snowIn16d: number
  /** Totals over the next 7 days, the actionable trip-planning window. */
  snowIn7d: number
  precipIn16d: number
  /** Days with measurable precip falling warm enough to be rain at grid level. */
  rainRiskDays: number
  /** Days with >= 2 in of snow. */
  powderDays: number
}

interface OpenMeteoPoint {
  latitude: number
  longitude: number
  elevation: number
  daily: {
    time: string[]
    snowfall_sum: (number | null)[]
    precipitation_sum: (number | null)[]
    temperature_2m_max: (number | null)[]
    temperature_2m_min: (number | null)[]
  }
}

const n = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : 0)

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = []
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size))
  return out
}

async function fetchChunk(resorts: Resort[]): Promise<OpenMeteoPoint[]> {
  const params = new URLSearchParams({
    latitude: resorts.map((r) => r.lat).join(','),
    longitude: resorts.map((r) => r.lon).join(','),
    daily: 'snowfall_sum,precipitation_sum,temperature_2m_max,temperature_2m_min',
    forecast_days: String(FORECAST_DAYS),
    timezone: 'UTC',
    models: 'gfs_seamless',
  })
  const res = await fetch(`${GFS_ENDPOINT}?${params}`, {
    signal: AbortSignal.timeout(25_000),
  })
  if (!res.ok) throw new Error(`GFS ${res.status}: ${(await res.text()).slice(0, 200)}`)
  const json = await res.json()
  // Open-Meteo returns a bare object for a single point, an array for many.
  return Array.isArray(json) ? json : [json]
}

function toForecast(resort: Resort, p: OpenMeteoPoint): ResortForecast {
  const d = p.daily
  const daily: DailyPoint[] = d.time.map((date, i) => ({
    date,
    snowIn: n(d.snowfall_sum[i]) * CM_TO_IN,
    precipIn: n(d.precipitation_sum[i]) * MM_TO_IN,
    highC: n(d.temperature_2m_max[i]),
    lowC: n(d.temperature_2m_min[i]),
  }))

  const sum = (xs: DailyPoint[], k: 'snowIn' | 'precipIn') =>
    xs.reduce((a, b) => a + b[k], 0)

  return {
    resortId: resort.id,
    modelElevationM: p.elevation,
    daily,
    snowIn16d: sum(daily, 'snowIn'),
    snowIn7d: sum(daily.slice(0, 7), 'snowIn'),
    precipIn16d: sum(daily, 'precipIn'),
    // Wet and above freezing at grid level = rain, not powder.
    rainRiskDays: daily.filter((x) => x.precipIn > 0.04 && x.highC > 2).length,
    powderDays: daily.filter((x) => x.snowIn >= 2).length,
  }
}

/**
 * 16-day GFS forecast for every resort in the dataset.
 *
 * @remarks
 * - Cached against the GFS run cadence and tagged `noaa-forecast`.
 * - The scheduled refresh invalidates it as new model runs land.
 * - Remote, so a spike costs Open-Meteo one fetch, not one per instance.
 */
export async function getForecasts(): Promise<Record<string, ResortForecast>> {
  'use cache: remote'
  cacheLife('hours')
  cacheTag('noaa', 'noaa-forecast')

  const groups = chunk(RESORTS, CHUNK)
  const results = await Promise.all(
    groups.map(async (group) => {
      try {
        const points = await fetchChunk(group)
        return group.map((resort, i) =>
          points[i] ? toForecast(resort, points[i]) : null,
        )
      } catch {
        // A failed chunk degrades to "no forecast" rather than a dead page.
        return group.map(() => null)
      }
    }),
  )

  const out: Record<string, ResortForecast> = {}
  for (const f of results.flat()) if (f) out[f.resortId] = f
  return out
}
