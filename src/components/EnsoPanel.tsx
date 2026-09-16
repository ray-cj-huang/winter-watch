import type { EnsoState } from '@/lib/enso'
import { nino } from '@/lib/format'
import { anomalyColor } from '@/lib/palette'

function Vital({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col gap-0.5 bg-surface px-4 py-3">
      <dt className="font-mono text-[0.7rem] uppercase tracking-[0.1em] text-ink-faint">
        {label}
      </dt>
      <dd className="tnum font-serif text-2xl leading-none">
        {value}
        {unit && <span className="ml-1 font-sans text-sm text-ink-soft">{unit}</span>}
      </dd>
    </div>
  )
}

export default function EnsoPanel({ enso }: { enso: EnsoState }) {
  const regions = [
    { name: nino('Nino 4'), value: enso.nino4 },
    { name: nino('Nino 3.4'), value: enso.nino34 },
    { name: nino('Nino 3'), value: enso.nino3 },
    { name: nino('Nino 1+2'), value: enso.nino12 },
  ]

  // Axis stretches to fit the data -- a genuine super El Nino runs past +4.
  const maxAnom = Math.max(4, Math.ceil(Math.max(...regions.map((r) => r.value))))
  const min = -1
  const span = maxAnom - min
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
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-rule pb-2.5">
        <h2 className="font-serif text-2xl">Ocean state</h2>
        <p className="eyebrow">NOAA CPC · week of {observed}</p>
      </div>

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
        <Vital label="Flavor" value={enso.flavor} />
      </dl>

      <div className="mt-6 flex flex-col gap-2.5">
        {regions.map((r) => {
          const widthPct = (Math.abs(r.value) / span) * 100
          const negative = r.value < 0
          return (
            <div
              key={r.name}
              className="grid items-center gap-3"
              style={{ gridTemplateColumns: '5rem 1fr 3rem' }}
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

        <div className="grid gap-3" style={{ gridTemplateColumns: '5rem 1fr 3rem' }}>
          <span />
          <span className="relative block h-5">
            {ticks.map((t) => (
              <span
                key={t}
                className="tnum absolute -translate-x-1/2 font-mono text-[0.68rem] text-ink-faint"
                style={{ left: `${((t - min) / span) * 100}%` }}
              >
                {t > 0 ? `+${t}` : t}
              </span>
            ))}
          </span>
          <span />
        </div>
      </div>

      <p className="mt-4 max-w-[62ch] text-sm text-ink-faint">
        Sea surface temperature departure from normal, °C, against the 1991–2020 base
        period. The west–east gradient is the tell:{' '}
        <strong className="font-semibold text-ink-soft">
          {enso.nino12 > enso.nino4 ? 'warmest off South America' : 'warmest near the Date Line'}
        </strong>{' '}
        marks this as {enso.flavor === 'Eastern Pacific' ? 'an' : 'a'}{' '}
        <em>{enso.flavor.toLowerCase()}</em> event. Eastern-Pacific events load the
        subtropical jet and drive warmer, wetter storms into the US Southwest.
      </p>
    </section>
  )
}
