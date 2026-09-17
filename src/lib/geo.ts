// Keeps d3-geo and the topojson atlases out of the client bundle.
import 'server-only'
import {
  geoAlbersUsa,
  geoBounds,
  geoConicConformal,
  geoNaturalEarth1,
  geoPath,
  type GeoPermissibleObjects,
  type GeoProjection,
} from 'd3-geo'
import { feature, mesh } from 'topojson-client'
import type { Topology, GeometryCollection } from 'topojson-specification'
import type { Feature, FeatureCollection } from 'geojson'
import statesTopo from 'us-atlas/states-10m.json'
import world50 from 'world-atlas/countries-50m.json'
import world110 from 'world-atlas/countries-110m.json'
import type { MacroRegionId } from './types'
import { MACRO_LABELS, VIEW_BOX, type MapGeometry, type ProjectedPoint } from './map-types'

export { VIEW_BOX }
export type { MapGeometry, ProjectedPoint }

const PADDING = 12

type BBox = [west: number, south: number, east: number, north: number]

interface ViewSpec {
  label: string
  projection: () => GeoProjection
  /** Frames the view, and selects which countries are worth serialising. */
  bbox: BBox
  source: 'us' | 'world'
  resolution?: '50m' | '110m'
  /**
   * How to frame the projection. Defaults to the bbox.
   *
   * @remarks
   * - A bbox spanning 360 degrees is degenerate as a spherical ring.
   * - Its east and west edges coincide, so whole-globe views fit the sphere.
   */
  fit?: 'bbox' | 'sphere'
}

export const MAP_VIEWS: Record<MacroRegionId, ViewSpec> = {
  us: {
    label: MACRO_LABELS.us,
    projection: () => geoAlbersUsa(),
    bbox: [-125, 24, -66, 50],
    source: 'us',
  },
  canada: {
    label: MACRO_LABELS.canada,
    projection: () => geoConicConformal().parallels([49, 77]).rotate([100, 0]),
    bbox: [-134, 41, -58, 62],
    source: 'world',
    resolution: '50m',
  },
  europe: {
    label: MACRO_LABELS.europe,
    projection: () => geoConicConformal().parallels([43, 55]).rotate([-8, 0]),
    bbox: [-3, 39, 19, 53],
    source: 'world',
    resolution: '50m',
  },
  japan: {
    label: MACRO_LABELS.japan,
    projection: () => geoConicConformal().parallels([33, 45]).rotate([-137, 0]),
    bbox: [126, 28, 148, 47],
    source: 'world',
    resolution: '50m',
  },
  southern: {
    label: MACRO_LABELS.southern,
    // Centred so the Andes and the Australian Alps both sit in frame.
    projection: () => geoNaturalEarth1().rotate([-219, 0]),
    bbox: [-180, -58, 180, 8],
    source: 'world',
    resolution: '110m',
    fit: 'sphere',
  },
}

/**
 * Bounding box as a GeoJSON polygon, wound CLOCKWISE.
 *
 * @remarks
 * - Winding is not cosmetic: d3-geo uses spherical polygon semantics.
 * - A counter-clockwise ring describes the whole globe *minus* the box.
 * - Fitting that collapses a conic projection to ~0 and renders an empty map.
 */
function bboxPolygon([w, s, e, n]: BBox) {
  return {
    type: 'Polygon' as const,
    coordinates: [[[w, s], [w, n], [e, n], [e, s], [w, s]]],
  }
}

/** Keep features whose own bounds overlap the view box, with a little margin. */
function intersects(f: Feature, [w, s, e, n]: BBox, margin = 6): boolean {
  const [[fw, fs], [fe, fn]] = geoBounds(f as GeoPermissibleObjects)
  if (!Number.isFinite(fw) || !Number.isFinite(fs)) return false
  return fe >= w - margin && fw <= e + margin && fn >= s - margin && fs <= n + margin
}

function projectionFor(view: ViewSpec): GeoProjection {
  const target =
    view.fit === 'sphere' ? { type: 'Sphere' as const } : bboxPolygon(view.bbox)
  return view.projection().fitExtent(
    [
      [PADDING, PADDING],
      [VIEW_BOX.width - PADDING, VIEW_BOX.height - PADDING],
    ],
    target,
  )
}

export function buildMap(macro: MacroRegionId): MapGeometry {
  const view = MAP_VIEWS[macro]
  const path = geoPath(projectionFor(view))

  if (view.source === 'us') {
    const topo = statesTopo as unknown as Topology<{
      states: GeometryCollection
      nation: GeometryCollection
    }>
    const states = feature(topo, topo.objects.states) as FeatureCollection
    const nation = feature(topo, topo.objects.nation) as FeatureCollection
    return {
      fill: path(states as unknown as GeoPermissibleObjects) ?? '',
      // `a !== b` keeps interior state lines only, dropping the coastline.
      borders: path(mesh(topo, topo.objects.states, (a, b) => a !== b)) ?? '',
      outline: path(nation as unknown as GeoPermissibleObjects) ?? '',
    }
  }

  const atlas = view.resolution === '110m' ? world110 : world50
  const topo = atlas as unknown as Topology<{ countries: GeometryCollection }>
  const all = (feature(topo, topo.objects.countries) as FeatureCollection).features
  const visible: FeatureCollection = {
    type: 'FeatureCollection',
    features: all.filter((f) => intersects(f, view.bbox)),
  }
  const d = path(visible as unknown as GeoPermissibleObjects) ?? ''
  // Country outlines double as the border layer for world views.
  return { fill: d, borders: '', outline: d }
}

/** Project resort coordinates into the same SVG space as `buildMap`. */
export function projectPoints(
  macro: MacroRegionId,
  points: { id: string; lat: number; lon: number }[],
): ProjectedPoint[] {
  const projection = projectionFor(MAP_VIEWS[macro])
  return points.flatMap((p) => {
    // geoAlbersUsa returns null for anything outside the US composite.
    const xy = projection([p.lon, p.lat])
    if (!xy || !Number.isFinite(xy[0]) || !Number.isFinite(xy[1])) return []
    return [{ id: p.id, x: xy[0], y: xy[1] }]
  })
}
