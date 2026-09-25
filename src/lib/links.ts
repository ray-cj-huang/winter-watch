import type { Resort } from './types'

/**
 * Open the resort's own Google Maps listing.
 *
 * @remarks
 * - A coordinate query drops a bare pin with no name, hours or reviews.
 * - A name query varies by viewer and can land on a town, a peak or an ad.
 */
export function mapsUrl(resort: Resort): string {
  return `https://maps.google.com/?cid=${resort.mapsCid}`
}
