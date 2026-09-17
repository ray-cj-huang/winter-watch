import { RESORTS_BY_ID } from './resorts'
import type { ScoreMode } from './score'
import type { MacroRegionId, PassId } from './types'

export const PASS_IDS: PassId[] = ['ikon-base', 'ikon']
export const MACRO_IDS: MacroRegionId[] = ['us', 'canada', 'europe', 'japan', 'southern']

export const PASS_LABELS: Record<PassId, string> = {
  'ikon-base': 'Ikon Base',
  ikon: 'Ikon',
}

export const PASS_BLURBS: Record<PassId, string> = {
  'ikon-base': 'Base tier · 5 days at most destinations',
  ikon: 'Full pass · 7 days at partners, unlimited at core',
}

const DEFAULT_PASS: PassId = 'ikon-base'
const DEFAULT_MACRO: MacroRegionId = 'us'

/** Everything the board's query string encodes. */
export interface ViewState {
  pass: PassId
  macro: MacroRegionId
  /** An explicit override. `null` leaves the choice to `pickMode`. */
  mode: ScoreMode | null
  selectedId: string | null
}

export type RawParams = Record<string, string | string[] | undefined>

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)

/** Unknown values fall back to defaults: a link mangled in chat still renders. */
export function parseViewState(params: RawParams): ViewState {
  const pass = one(params.pass)
  const macro = one(params.macro)
  const mode = one(params.mode)
  const id = one(params.id)

  return {
    pass: PASS_IDS.includes(pass as PassId) ? (pass as PassId) : DEFAULT_PASS,
    macro: MACRO_IDS.includes(macro as MacroRegionId)
      ? (macro as MacroRegionId)
      : DEFAULT_MACRO,
    mode: mode === 'live' || mode === 'seasonal' ? mode : null,
    selectedId: id && RESORTS_BY_ID.has(id) ? id : null,
  }
}

/** Defaults are omitted so an untouched board stays `/`. */
export function viewStatePath(v: ViewState): string {
  const q = new URLSearchParams()
  if (v.pass !== DEFAULT_PASS) q.set('pass', v.pass)
  if (v.macro !== DEFAULT_MACRO) q.set('macro', v.macro)
  if (v.mode) q.set('mode', v.mode)
  if (v.selectedId) q.set('id', v.selectedId)
  const query = q.toString()
  return query ? `/?${query}` : '/'
}
