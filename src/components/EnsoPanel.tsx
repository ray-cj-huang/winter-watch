import { getNino34Record, type EnsoState } from '@/lib/enso'
import { nino } from '@/lib/format'
import { anomalyColor } from '@/lib/palette'

/** Lowercased mid-sentence, but Pacific stays a proper noun. */
const FLAVOR_INLINE: Record<EnsoState['flavor'], string> = {
  'Eastern Pacific': 'eastern-Pacific',
  'Central Pacific': 'central-Pacific',
  Mixed: 'mixed',
}

const FLAVOR_CONSEQUENCE: Record<EnsoState['flavor'], string> = {
  'Eastern Pacific':
    'Those years push the subtropical jet across the southern US, which usually means a wet Southwest and a dry Pacific Northwest.',
  'Central Pacific':
    'Those years keep the storm track further west, so the Southwest signal is weaker and less reliable than the numbers suggest.',
  Mixed:
    'The pattern sits between the two usual flavours, so expect a weaker regional signal than the numbers alone imply.',
}
import Nino34Trend from './Nino34Trend'
import SectionHeader from './SectionHeader'
import ShareLink from './ShareLink'

function Vital({
  label,
  value,
  unit,
  className = '',
}: {
  label: string
  value: string
  unit?: string
  className?: string
}) {
  return (
    <div className={`flex flex-col gap-0.5 bg-surface px-4 py-3 ${className}`}>
      <dt className="font-mono text-meta uppercase tracking-widest text-ink-faint">
        {label}
      </dt>
      <dd className="tnum font-serif text-2xl leading-none">
        {value}
        {unit && <span className="ml-1 font-sans text-sm text-ink-soft">{unit}</span>}
      </dd>
    </div>
  )
}

export default async function EnsoPanel({ enso }: { enso: EnsoState }) {
  const regions = [
    { name: nino('Nino 4'), value: enso.nino4 },
    { name: nino('Nino 3.4'), value: enso.nino34 },
    { name: nino('Nino 3'), value: enso.nino3 },
    { name: nino('Nino 1+2'), value: enso.nino12 },
  ]

  // Axis follows the data rather than assuming a shape: no negative half
  // during an El Nino, and it still extends left if a region goes cold.
  const values = regions.map((r) => r.value)
  const min = Math.min(0, Math.floor(Math.min(...values)))
  const max = Math.max(1, Math.ceil(Math.max(...values)))
  const span = max - min
  const zeroPct = ((0 - min) / span) * 100
  const ticks = Array.from({ length: span + 1 }, (_, i) => min + i)

  const observed = new Date(enso.weekEnding).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return (
    <section>
      <SectionHeader title="Ocean state" meta={<>NOAA CPC · week of {observed}</>} />

      <dl className="grid grid-cols-2 gap-px border border-rule bg-rule sm:grid-cols-3 lg:grid-cols-5">
        <Vital label="Phase" value={nino(enso.phase)} />
        <Vital label="Strength" value={enso.strength} />
        <Vital
          label={nino('Nino 3.4')}
          value={`${enso.nino34 > 0 ? '+' : ''}${enso.nino34.toFixed(1)}`}
          unit="°C"
        />
        <Vital
          label={enso.oniSeason ? `ONI · ${enso.oniSeason}` : 'ONI'}
          value={
            enso.oniValue === null
              ? '—'
              : `${enso.oniValue > 0 ? '+' : ''}${enso.oniValue.toFixed(1)}`
          }
          unit={enso.oniValue === null ? undefined : '°C'}
        />
        <Vital label="Flavor" value={enso.flavor} className="col-span-2 lg:col-span-1" />
      </dl>

      <div className="mt-6 flex flex-col gap-2.5">
        {regions.map((r) => {
          const widthPct = (Math.abs(r.value) / span) * 100
          const negative = r.value < 0
          return (
            <div
              key={r.name}
              className="grid grid-cols-[5rem_1fr_3rem] items-center gap-3"
            >
              <span className="text-right font-mono text-xs text-ink-soft">{r.name}</span>
              <span className="relative block h-[22px] bg-surface-sunk">
                <span
                  className="absolute -top-[3px] -bottom-[3px] w-px bg-rule-strong"
                  style={{ left: `${zeroPct}%` }}
                />
                <span
                  className="absolute top-[3px] bottom-[3px] min-w-[2px]"
                  style={{
                    left: negative ? `${zeroPct - widthPct}%` : `${zeroPct}%`,
                    width: `${widthPct}%`,
                    background: anomalyColor(r.value),
                  }}
                />
              </span>
              <span className="tnum font-mono text-xs font-semibold">
                {r.value > 0 ? '+' : ''}
                {r.value.toFixed(1)}
              </span>
            </div>
          )
        })}

        <div className="grid grid-cols-[5rem_1fr_3rem] gap-3">
          <span />
          <span className="relative block h-5">
            {ticks.map((t) => (
              <span
                key={t}
                className="tnum absolute -translate-x-1/2 font-mono text-meta text-ink-faint"
                style={{ left: `${((t - min) / span) * 100}%` }}
              >
                {t > 0 ? `+${t}` : t}
              </span>
            ))}
          </span>
          <span />
        </div>
      </div>

      <p className="mt-4 text-sm text-ink-faint">
        Each bar is one Niño region&apos;s sea surface temperature against its
        1991–2020 average. The warmest water sits{' '}
        <strong className="font-semibold text-ink-soft">
          {enso.nino12 > enso.nino4 ? 'off South America' : 'near the Date Line'}
        </strong>
        , which makes this {enso.flavor === 'Eastern Pacific' ? 'an' : 'a'}{' '}
        {FLAVOR_INLINE[enso.flavor]} event. {FLAVOR_CONSEQUENCE[enso.flavor]}
      </p>

      <Nino34Trend history={await getNino34Record()} />

      <div className="mt-4">
        <ShareLink cardUrl="/api/og?card=ocean" href="/?view=ocean#ocean" />
      </div>
    </section>
  )
}
