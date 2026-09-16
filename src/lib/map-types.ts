import type { MacroRegionId } from './types'

// Client-safe half of the map module. `geo.ts` is server-only -- it pulls in
// d3-geo and the topojson atlases -- so anything the browser needs lives here.

export const VIEW_BOX = { width: 820, height: 500 }

export interface MapGeometry {
  /** Filled landmass / state polygons. */
  fill: string
  /** Internal borders, stroked lighter than the outline. */
  borders: string
  outline: string
}

export interface ProjectedPoint {
  id: string
  x: number
  y: number
}

export const MACRO_LABELS: Record<MacroRegionId, string> = {
  us: 'United States',
  canada: 'Canada',
  europe: 'Europe',
  japan: 'Japan',
  southern: 'Southern Hemisphere',
}
