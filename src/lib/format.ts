/**
 * Data keeps ASCII identifiers so they stay easy to grep and compare;
 * anything user-facing gets the real diacritics.
 */
export function nino(text: string): string {
  return text.replace(/Nino/g, 'Niño')
}

/**
 * Thousands separators, pinned to en-US.
 *
 * Bare `toLocaleString()` follows the runtime's locale, which differs between
 * server and browser: a de-DE client renders "8.530" over a server-rendered
 * "8,530" and trips a hydration mismatch.
 */
export function num(value: number): string {
  return value.toLocaleString('en-US')
}
