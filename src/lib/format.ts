/**
 * Data keeps ASCII identifiers so they stay easy to grep and compare;
 * anything user-facing gets the real diacritics.
 */
export function nino(text: string): string {
  return text.replace(/Nino/g, 'Niño')
}
