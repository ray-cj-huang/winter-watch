export type PassId = 'ikon' | 'ikon-base' | 'epic' | 'epic-local'

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

// Conventions, not brands: they document a range, they do not enforce it.

/** A coefficient in [-1, 1]. Positive is favored, negative disfavored. */
export type SignedUnit = number

/** A fraction in [0, 1]. */
export type Unit = number

/** A ranking value in [0, 100]. */
export type Score = number

interface AccessCommon {
  /** Whether the holiday blackout calendar applies at this tier. */
  blackouts: boolean
  /** Free-text caveat, e.g. Snowbird-only at the Base tier. */
  note?: string
}

export type Access =
  | (AccessCommon & { kind: 'unlimited' })
  | (AccessCommon & { kind: 'days'; days: number })

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
  baseElevationFt: number
  summitElevationFt: number
  /** The climatological baseline a season is measured against. */
  avgAnnualSnowIn: number
  /** Response of this resort's winter precipitation to past El Niños. */
  ensoSensitivity: SignedUnit
  /** Access by pass tier. A resort absent from `ikon-base` is full-Ikon only. */
  access: Partial<Record<PassId, Access>>
  website: string
}
