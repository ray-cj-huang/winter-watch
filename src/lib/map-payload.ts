import { cacheLife, cacheTag } from 'next/cache'
import { buildMap, projectPoints } from './geo'
import { MACRO_LABELS, type MapGeometry, type ProjectedPoint } from './map-types'
import { RESORTS } from './resorts'
import type { MacroRegionId } from './types'

const MACROS = Object.keys(MACRO_LABELS) as MacroRegionId[]

export interface MacroMap {
  geometry: MapGeometry
  points: ProjectedPoint[]
}

/**
 * Projected geometry for one region.
 *
 * @remarks
 * - Nothing here depends on live data, so it is held as long as possible.
 * - Returning path strings is what keeps d3-geo out of the client bundle.
 */
export async function getMacroMap(macro: MacroRegionId): Promise<MacroMap> {
  'use cache'
  cacheLife('max')
  cacheTag('map-geometry')

  return {
    geometry: buildMap(macro),
    points: projectPoints(
      macro,
      RESORTS.filter((r) => r.macro === macro).map((r) => ({
        id: r.id,
        lat: r.lat,
        lon: r.lon,
      })),
    ),
  }
}

/** Every region at once, for the board's client-side region switcher. */
export async function getMapPayload(): Promise<{
  maps: Record<MacroRegionId, MapGeometry>
  points: Record<MacroRegionId, ProjectedPoint[]>
}> {
  'use cache'
  cacheLife('max')
  cacheTag('map-geometry')

  const maps = {} as Record<MacroRegionId, MapGeometry>
  const points = {} as Record<MacroRegionId, ProjectedPoint[]>

  for (const macro of MACROS) {
    const built = await getMacroMap(macro)
    maps[macro] = built.geometry
    points[macro] = built.points
  }
  return { maps, points }
}
