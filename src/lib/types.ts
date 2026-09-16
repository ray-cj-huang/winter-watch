export type PassId = 'ikon' | 'ikon-base'

export type RegionId =
  | 'us-west'
  | 'us-rockies'
  | 'us-southwest'
  | 'us-pnw'
  | 'us-east'
  | 'canada-west'
  | 'canada-east'
  | 'europe'
  | 'japan'
  | 'south-pacific'
  | 'south-america'

/** Coarse grouping used by the region switcher. US is the default view. */
export type MacroRegionId = 'us' | 'canada' | 'europe' | 'japan' | 'southern'

export interface Access {
  /** 'unlimited' = no day cap. 'days' = capped, see `days`. */
  kind: 'unlimited' | 'days'
  days?: number
  /** Whether the holiday blackout calendar applies at this tier. */
  blackouts: boolean
  /** Free-text caveat, e.g. Snowbird-only at the Base tier. */
  note?: string
}

export interface Resort {
  id: string
  name: string
  /** State / province / country subdivision shown in the UI. */
  locale: string
  country: string
  region: RegionId
  macro: MacroRegionId
  lat: number
  lon: number
  /** Feet. */
  baseElevationFt: number
  summitElevationFt: number
  /** Average annual snowfall in inches, used as the climatological baseline. */
  avgAnnualSnowIn: number
  /**
   * El Nino teleconnection coefficient in [-1, 1].
   *
   * Positive = favored in El Nino winters (subtropical jet loads the southern
   * tier); negative = on the dry side of the split (polar jet retreats north).
   * Derived from published ENSO composite anomaly patterns for DJF
   * precipitation. `score.ts` documents how the coefficient is applied.
   */
  ensoSensitivity: number
  /** Access by pass tier. A resort absent from `ikon-base` is full-Ikon only. */
  access: Partial<Record<PassId, Access>>
  website: string
}
