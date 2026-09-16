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
 * Bare `toLocaleString()` resolves against the *runtime's* locale, which
 * differs between the server (Node's default) and the browser. A de-DE client
 * would render "8.530" over a server-rendered "8,530" and trip a hydration
 * mismatch, so every user-facing number goes through here.
 */
export function num(value: number): string {
  return value.toLocaleString('en-US')
}
