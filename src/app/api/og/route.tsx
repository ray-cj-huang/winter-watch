import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { ImageResponse } from 'next/og'
import { getEnsoState } from '@/lib/enso'
import { getForecasts } from '@/lib/forecast'
import { RESORTS, RESORTS_BY_ID } from '@/lib/resorts'
import { pickMode, rankInRegion, scoreResorts } from '@/lib/score'
import { boardVerdict } from '@/lib/verdict'
import { CARD_SIZE } from '@/lib/site'
import { PASS_IDS, parseViewState } from '@/lib/view-state'
import { BoardCard, OceanCard, ResortCard } from './cards'

const [serif, mono] = await Promise.all([
  readFile(join(process.cwd(), 'assets/fonts/Newsreader-SemiBold.ttf')),
  readFile(join(process.cwd(), 'assets/fonts/IBMPlexMono-Medium.ttf')),
])

const FONTS = [
  { name: 'Newsreader', data: serif, weight: 600 as const, style: 'normal' as const },
  { name: 'IBM Plex Mono', data: mono, weight: 500 as const, style: 'normal' as const },
]

/** Tracks `cacheLife('hours')` on the NOAA reads underneath. */
const CACHE_CONTROL = 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400'

function png(card: React.ReactElement) {
  return new ImageResponse(card, {
    ...CARD_SIZE,
    fonts: FONTS,
    headers: { 'Cache-Control': CACHE_CONTROL },
  })
}

/**
 * Share cards for the board, one resort, and the ocean state.
 *
 * @remarks
 * - A route handler, not `opengraph-image`: the board is a query state.
 * - Every number comes from the cached NOAA reads the page renders from.
 */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams)
  const enso = await getEnsoState()

  if (params.card === 'ocean') return png(<OceanCard enso={enso} />)

  const forecasts = await getForecasts()
  const view = parseViewState(params)

  if (params.card === 'resort') {
    const resort = RESORTS_BY_ID.get(params.id ?? '')
    if (!resort) return new Response('Unknown resort', { status: 404 })

    const pass =
      PASS_IDS.find((p) => p === view.pass && resort.access[p]) ??
      PASS_IDS.find((p) => resort.access[p])!
    const placing = rankInRegion(resort, pass, enso, forecasts)
    if (!placing) return new Response('Unknown resort', { status: 404 })

    return png(
      <ResortCard
        enso={enso}
        entry={placing.entry}
        pass={pass}
        macro={resort.macro}
        rank={placing.rank}
        field={placing.board.length}
      />,
    )
  }

  const inRegion = RESORTS.filter((r) => r.macro === view.macro)
  const mode = view.mode ?? pickMode(inRegion, forecasts)
  const scored = scoreResorts(inRegion, view.pass, enso, forecasts, mode)

  return png(
    <BoardCard
      enso={enso}
      pass={view.pass}
      macro={view.macro}
      mode={mode}
      scored={scored}
      verdict={boardVerdict(scored[0], view.pass, mode)}
    />,
  )
}
