import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import BlackoutDates from '@/components/BlackoutDates'
import ForecastStrip from '@/components/ForecastStrip'
import JsonLd from '@/components/JsonLd'
import ResortMap from '@/components/ResortMap'
import SectionHeader from '@/components/SectionHeader'
import ShareLink from '@/components/ShareLink'
import { getEnsoState } from '@/lib/enso'
import { num } from '@/lib/format'
import { getForecasts } from '@/lib/forecast'
import { getMacroMap } from '@/lib/map-payload'
import { MACRO_LABELS } from '@/lib/map-types'
import { scoreColor } from '@/lib/palette'
import { RESORTS, RESORTS_BY_ID } from '@/lib/resorts'
import { rankInRegion } from '@/lib/score'
import { OG_BASE, absolute, ogImage } from '@/lib/site'
import type { Access, PassId, Resort } from '@/lib/types'
import { boardVerdict, resortRationale } from '@/lib/verdict'
import { PASS_IDS, PASS_LABELS, viewStatePath } from '@/lib/view-state'

export function generateStaticParams() {
  return RESORTS.map((r) => ({ id: r.id }))
}

const tiersFor = (resort: Resort) => PASS_IDS.filter((p) => resort.access[p])

/** Static facts only, so the head does not wait on NOAA. */
export async function generateMetadata({
  params,
}: PageProps<'/resort/[id]'>): Promise<Metadata> {
  const { id } = await params
  const resort = RESORTS_BY_ID.get(id)
  if (!resort) return {}

  const tiers = tiersFor(resort)
    .map((p) => PASS_LABELS[p])
    .join(' and ')
  const description = `${resort.name}, ${resort.locale}: ${num(resort.baseElevationFt)} ft base, ${num(resort.summitElevationFt)} ft summit, ${resort.avgAnnualSnowIn}" of snow in an average year. On ${tiers}. Ranked live against the NOAA ENSO signal and the 16-day GFS run.`
  const card = ogImage(`/api/og?card=resort&id=${resort.id}`, `${resort.name} — current standing`)

  return {
    title: resort.name,
    description,
    alternates: { canonical: `/resort/${resort.id}` },
    openGraph: {
      ...OG_BASE,
      title: resort.name,
      description,
      url: `/resort/${resort.id}`,
      images: [card],
    },
    twitter: { title: resort.name, description, images: [card] },
  }
}

function accessLine(access: Access): string {
  const allowance = access.kind === 'unlimited' ? 'Unlimited days' : `${access.days} days`
  const blackout = access.blackouts ? 'holiday blackouts apply' : 'no blackouts'
  return `${allowance} · ${blackout}`
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-micro uppercase tracking-wide text-ink-faint">{label}</dt>
      <dd className="tnum font-mono text-base">{value}</dd>
    </div>
  )
}

async function LiveStanding({ resort }: { resort: Resort }) {
  const [enso, forecasts] = await Promise.all([getEnsoState(), getForecasts()])
  const pass = tiersFor(resort)[0]
  const placing = rankInRegion(resort, pass, enso, forecasts)
  if (!placing) notFound()

  const { entry, board, rank, mode } = placing
  const map = await getMacroMap(resort.macro)
  const boardPath = viewStatePath({
    pass,
    macro: resort.macro,
    mode: null,
    selectedId: resort.id,
  })

  return (
    <section className="pt-10">
      <SectionHeader
        title="Where it stands"
        meta={<>{mode === 'live' ? 'Live GFS run' : 'Seasonal signal'}</>}
      />

      <div className="flex flex-wrap items-baseline gap-x-6 gap-y-2">
        <span
          className="tnum font-mono text-6xl font-semibold leading-none"
          style={{ color: scoreColor(entry.score) }}
        >
          {Math.round(entry.score)}
        </span>
        <span className="font-serif text-2xl" style={{ color: scoreColor(entry.score) }}>
          {entry.verdict}
        </span>
        <span className="tnum font-mono text-sm text-ink-soft">
          #{rank} of {board.length} · {PASS_LABELS[pass]} · {MACRO_LABELS[resort.macro]}
        </span>
      </div>

      <p className="mt-3 max-w-[46rem] text-sm text-ink-soft">
        {resortRationale(entry, enso)}
      </p>

      <dl className="mt-5 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
        <Stat label="Seasonal" value={`${Math.round(entry.seasonalScore)}`} />
        <Stat
          label="Live GFS"
          value={entry.liveScore === null ? '—' : `${Math.round(entry.liveScore)}`}
        />
        <Stat
          label="Next 7 days"
          value={entry.forecast ? `${entry.forecast.snowIn7d.toFixed(1)}"` : '—'}
        />
        <Stat
          label="Next 16 days"
          value={entry.forecast ? `${entry.forecast.snowIn16d.toFixed(1)}"` : '—'}
        />
      </dl>

      {entry.forecast && <ForecastStrip forecast={entry.forecast} />}

      <div className="mt-6 border border-rule bg-surface p-2">
        <ResortMap
          geometry={map.geometry}
          points={map.points}
          scored={board}
          mode={mode}
          selectedId={resort.id}
        />
      </div>

      <p className="mt-3 text-sm text-ink-soft">
        {boardVerdict(board[0], pass, mode)}{' '}
        <Link href={boardPath} className="text-accent underline underline-offset-4">
          See the full board →
        </Link>
      </p>
    </section>
  )
}

function StandingFallback() {
  return (
    <section className="pt-10">
      <SectionHeader title="Where it stands" meta="Loading" />
      <div className="h-[32rem] animate-pulse border border-rule bg-surface" />
    </section>
  )
}

export default async function ResortPage({ params }: PageProps<'/resort/[id]'>) {
  const { id } = await params
  const resort = RESORTS_BY_ID.get(id)
  if (!resort) notFound()

  const tiers = tiersFor(resort)
  const vertical = resort.summitElevationFt - resort.baseElevationFt

  return (
    <div className="mx-auto max-w-[68rem] px-5 pb-12">
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'SkiResort',
          name: resort.name,
          url: absolute(`/resort/${resort.id}`),
          sameAs: resort.website,
          address: { '@type': 'PostalAddress', addressRegion: resort.locale, addressCountry: resort.country },
          geo: { '@type': 'GeoCoordinates', latitude: resort.lat, longitude: resort.lon },
          elevation: `${resort.summitElevationFt} ft`,
        }}
      />
      <JsonLd
        data={{
          '@context': 'https://schema.org',
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'El Niño Winter Watch', item: absolute('/') },
            { '@type': 'ListItem', position: 2, name: resort.name },
          ],
        }}
      />

      <header className="flex flex-col gap-3.5 border-b-2 border-ink pb-5 pt-11">
        <Link href="/" className="eyebrow text-xs hover:text-accent">
          ← El Niño Winter Watch
        </Link>
        <h1 className="text-4xl tracking-tight sm:text-5xl">{resort.name}</h1>
        <p className="font-serif text-lg italic text-ink-soft">
          {resort.locale}, {resort.country} · {MACRO_LABELS[resort.macro]}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-x-8 gap-y-3">
          <p className="flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-xs text-ink-faint">
            <span>{tiers.map((p) => PASS_LABELS[p]).join(' · ')}</span>
            <a
              href={resort.website}
              target="_blank"
              rel="noreferrer"
              className="text-accent underline underline-offset-4"
            >
              Resort site ↗
            </a>
          </p>
          <ShareLink cardUrl={`/api/og?card=resort&id=${resort.id}`} />
        </div>
      </header>

      <Suspense fallback={<StandingFallback />}>
        <LiveStanding resort={resort} />
      </Suspense>

      <section className="pt-10">
        <SectionHeader title="The mountain" meta="Published figures" />
        <dl className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4">
          <Stat label="Base" value={`${num(resort.baseElevationFt)} ft`} />
          <Stat label="Summit" value={`${num(resort.summitElevationFt)} ft`} />
          <Stat label="Vertical" value={`${num(vertical)} ft`} />
          <Stat label="Avg snow" value={`${resort.avgAnnualSnowIn}"`} />
        </dl>
        <p className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-meta text-ink-faint">
          <a
            className="underline underline-offset-4 hover:text-accent"
            href={`https://forecast.weather.gov/MapClick.php?lat=${resort.lat}&lon=${resort.lon}`}
            target="_blank"
            rel="noreferrer"
          >
            NWS point forecast ↗
          </a>
          <a
            className="underline underline-offset-4 hover:text-accent"
            href={`https://www.google.com/maps/search/?api=1&query=${resort.lat},${resort.lon}`}
            target="_blank"
            rel="noreferrer"
          >
            Map ↗
          </a>
        </p>
      </section>

      <section className="pt-10">
        <SectionHeader title="Pass access" meta="Operator is the authority" />
        <dl className="flex flex-col gap-3">
          {PASS_IDS.map((p: PassId) => {
            const access = resort.access[p]
            return (
              <div key={p} className="border border-rule bg-surface px-4 py-3">
                <dt className="eyebrow text-micro">{PASS_LABELS[p]}</dt>
                <dd className="mt-1 text-sm text-ink-soft">
                  {access ? accessLine(access) : 'This tier does not reach this mountain.'}
                  {access?.note && (
                    <span className="block text-ink-faint">{access.note}</span>
                  )}
                </dd>
              </div>
            )
          })}
        </dl>

        {PASS_IDS.filter((p) => resort.access[p]?.blackouts).map((p) => (
          <div key={p} className="mt-4">
            <BlackoutDates pass={p} />
          </div>
        ))}

        <p className="mt-3 text-sm text-ink-faint">
          Alterra and Vail both adjust their rosters and blackout calendars
          between announcement and season, and secondary sources disagree on the
          details. The operators&apos; own destination pages are the authority.
        </p>

        <p className="mt-4 border border-rule border-l-[3px] border-l-hot bg-surface px-4 py-3.5 text-sm text-ink-soft">
          <strong className="font-semibold">This is a model, not a NOAA product.</strong>{' '}
          Every ocean and forecast number here comes from NOAA. The ranking built on
          them is this app&apos;s own, based on published ENSO composite patterns. For
          NOAA&apos;s official probability forecast, see the CPC seasonal outlook.
        </p>
      </section>

      <footer className="mt-12 flex flex-wrap justify-between gap-x-5 gap-y-1.5 border-t-2 border-ink pt-4 font-mono text-meta text-ink-faint">
        <Link href="/" className="hover:text-accent">
          El Niño Winter Watch · {RESORTS.length} destinations
        </Link>
        <span>Data: NOAA CPC + NOAA GFS</span>
      </footer>
    </div>
  )
}
