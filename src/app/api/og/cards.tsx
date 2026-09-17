import type { EnsoState } from '@/lib/enso'
import { nino, num } from '@/lib/format'
import { MACRO_LABELS } from '@/lib/map-types'
import { anomalyColor, scoreColor } from '@/lib/palette'
import type { ScoredResort, ScoreMode } from '@/lib/score'
import type { MacroRegionId, PassId } from '@/lib/types'
import { PASS_LABELS } from '@/lib/view-state'

// Satori resolves no CSS variables, and a crawler expresses no colour-scheme
// preference, so the light half of the globals.css palette is restated here.
const INK = '#0c1b24'
const INK_SOFT = '#465964'
const INK_FAINT = '#576b76'
const PAPER = '#e9eef0'
const SURFACE = '#f7f9fa'
const SURFACE_SUNK = '#dfe6e9'
const RULE = '#c6d2d8'
const ACCENT = '#c03d26'

const SWATCH: Record<string, string> = {
  '--cold': '#1d4e89',
  '--cool': '#2a7f93',
  '--neutral-anom': '#94a3aa',
  '--warm': '#d9972f',
  '--hot': '#c03d26',
}

/** A shared-palette `var(--cold)`, resolved to the literal Satori needs. */
function hex(cssVar: string): string {
  return SWATCH[cssVar.slice(4, -1)] ?? INK
}

const SERIF = 'Newsreader'
const MONO = 'IBM Plex Mono'

export const CARD = { width: 1200, height: 630 }

// 630 less the frame padding, the masthead rule and the footer rule. Fixed
// rather than flexible so the footer disclaimer can never be pushed off.
const BODY_HEIGHT = 466

function fmtWeek(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })
}

export function advisoryFor(enso: EnsoState): string {
  return nino(enso.phase === 'Neutral' ? 'ENSO Neutral' : `${enso.strength} ${enso.phase}`)
}

function Eyebrow({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        fontFamily: MONO,
        fontSize: 21,
        letterSpacing: 3,
        textTransform: 'uppercase',
        color: INK_FAINT,
      }}
    >
      {children}
    </div>
  )
}

function Pill({ children }: { children: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        background: ACCENT,
        color: '#ffffff',
        fontFamily: MONO,
        fontSize: 22,
        letterSpacing: 2.5,
        textTransform: 'uppercase',
        padding: '8px 18px',
      }}
    >
      {children}
    </div>
  )
}

/**
 * The frame every card shares.
 *
 * The disclaimer sits in the footer because a card gets reposted without the
 * page attached, and the ranking must not travel without it.
 */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
        background: PAPER,
        color: INK,
        padding: '40px 56px',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: `3px solid ${INK}`,
          paddingBottom: 14,
        }}
      >
        <Eyebrow>El Niño Winter Watch</Eyebrow>
        <Eyebrow>ENSO season tracker · 2026–27</Eyebrow>
      </div>

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          height: BODY_HEIGHT,
          overflow: 'hidden',
          paddingTop: 18,
        }}
      >
        {children}
      </div>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          borderTop: `2px solid ${INK}`,
          paddingTop: 14,
          fontFamily: MONO,
          fontSize: 20,
          color: INK_FAINT,
        }}
      >
        <div style={{ display: 'flex' }}>A model, not a NOAA product</div>
        <div style={{ display: 'flex' }}>NOAA CPC + NOAA GFS · winter-watch.vercel.app</div>
      </div>
    </div>
  )
}

function Header({ enso, trailing }: { enso: EnsoState; trailing: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
      <Pill>{advisoryFor(enso)}</Pill>
      <div style={{ display: 'flex', fontFamily: MONO, fontSize: 21, color: INK_FAINT }}>
        {trailing}
      </div>
    </div>
  )
}

export function BoardCard({
  enso,
  pass,
  macro,
  mode,
  scored,
  verdict,
}: {
  enso: EnsoState
  pass: PassId
  macro: MacroRegionId
  mode: ScoreMode
  scored: ScoredResort[]
  verdict: string
}) {
  return (
    <Frame>
      <Header
        enso={enso}
        trailing={nino(
          `Nino 3.4 ${enso.nino34 > 0 ? '+' : ''}${enso.nino34.toFixed(1)}°C · CPC week of ${fmtWeek(enso.weekEnding)}`,
        )}
      />

      <div style={{ display: 'flex', fontFamily: SERIF, fontSize: 50, lineHeight: 1.15, marginTop: 10 }}>
        {PASS_LABELS[pass]} · {MACRO_LABELS[macro]}
      </div>

      <div
        style={{
          display: 'flex',
          fontFamily: SERIF,
          fontSize: 24,
          color: INK_SOFT,
          marginTop: 6,
        }}
      >
        {verdict}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', marginTop: 14 }}>
        {scored.slice(0, 5).map((s, i) => (
          <div
            key={s.resort.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderTop: `1px solid ${RULE}`,
              padding: '4px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 18 }}>
              <div
                style={{
                  display: 'flex',
                  width: 40,
                  fontFamily: MONO,
                  fontSize: 22,
                  color: INK_FAINT,
                }}
              >
                {i + 1}
              </div>
              <div style={{ display: 'flex', fontFamily: SERIF, fontSize: 32 }}>
                {s.resort.name}
              </div>
              <div style={{ display: 'flex', fontFamily: MONO, fontSize: 20, color: INK_FAINT }}>
                {s.resort.locale}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
              {mode === 'live' && s.forecast && (
                <div style={{ display: 'flex', fontFamily: MONO, fontSize: 21, color: INK_SOFT }}>
                  {s.forecast.snowIn7d.toFixed(1)}&quot; / 7d
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  fontFamily: MONO,
                  fontSize: 36,
                  lineHeight: 1.1,
                  color: hex(scoreColor(s.score)),
                }}
              >
                {Math.round(s.score)}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          display: 'flex',
          marginTop: 'auto',
          paddingTop: 10,
          fontFamily: MONO,
          fontSize: 19,
          color: INK_FAINT,
        }}
      >
        {scored.length} destinations ranked ·{' '}
        {mode === 'live'
          ? 'live GFS run, mixed 65/35 with the seasonal signal'
          : 'seasonal ENSO signal'}
      </div>
    </Frame>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        minWidth: 190,
        background: SURFACE,
        border: `1px solid ${RULE}`,
        padding: '12px 18px',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontFamily: MONO,
          fontSize: 18,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: INK_FAINT,
        }}
      >
        {label}
      </div>
      <div style={{ display: 'flex', fontFamily: SERIF, fontSize: 32 }}>{value}</div>
    </div>
  )
}

export function ResortCard({
  enso,
  entry,
  pass,
  macro,
  rank,
  field,
}: {
  enso: EnsoState
  entry: ScoredResort
  pass: PassId
  macro: MacroRegionId
  rank: number
  field: number
}) {
  const f = entry.forecast
  const band = hex(scoreColor(entry.score))
  const peak = Math.max(0.5, ...(f?.daily.map((d) => d.snowIn) ?? [0]))

  return (
    <Frame>
      <Header enso={enso} trailing={`${entry.resort.locale} · ${entry.resort.country}`} />

      <div style={{ display: 'flex', fontFamily: SERIF, fontSize: 62, lineHeight: 1.15, marginTop: 10 }}>
        {entry.resort.name}
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 22, marginTop: 10 }}>
        <div style={{ display: 'flex', fontFamily: MONO, fontSize: 84, lineHeight: 1, color: band }}>
          {Math.round(entry.score)}
        </div>
        <div style={{ display: 'flex', fontFamily: SERIF, fontSize: 40, color: band }}>
          {entry.verdict}
        </div>
        <div style={{ display: 'flex', fontFamily: MONO, fontSize: 24, color: INK_SOFT }}>
          #{rank} of {field} · {PASS_LABELS[pass]} · {MACRO_LABELS[macro]}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 14, marginTop: 16 }}>
        <Stat label="Next 7 days" value={f ? `${f.snowIn7d.toFixed(1)}"` : '—'} />
        <Stat label="Next 16 days" value={f ? `${f.snowIn16d.toFixed(1)}"` : '—'} />
        <Stat label="Powder days" value={f ? String(f.powderDays) : '—'} />
        <Stat label="Base" value={`${num(entry.resort.baseElevationFt)} ft`} />
      </div>

      {f && (
        <div
          style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 16 }}
        >
          <div
            style={{
              display: 'flex',
              fontFamily: MONO,
              fontSize: 18,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: INK_FAINT,
            }}
          >
            16-day GFS snowfall
          </div>
          {f.snowIn16d < 0.1 ? (
            <div
              style={{
                display: 'flex',
                marginTop: 8,
                border: `1px dashed ${RULE}`,
                padding: '14px 18px',
                fontFamily: MONO,
                fontSize: 21,
                color: INK_FAINT,
              }}
            >
              No snow in the 16-day model window at this grid point.
            </div>
          ) : (
          <div
            style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 60, marginTop: 8 }}
          >
            {f.daily.map((d) => {
              const rain = d.precipIn > 0.04 && d.highC > 2
              return (
                <div
                  key={d.date}
                  style={{
                    display: 'flex',
                    flexGrow: 1,
                    height: Math.max(d.snowIn > 0 ? 4 : 2, (d.snowIn / peak) * 60),
                    background:
                      d.snowIn > 0 ? (rain ? SWATCH['--warm'] : SWATCH['--cool']) : SURFACE_SUNK,
                  }}
                />
              )
            })}
          </div>
          )}
        </div>
      )}
    </Frame>
  )
}

export function OceanCard({ enso }: { enso: EnsoState }) {
  const history = enso.nino34History
  const values = history.map((h) => h.anomaly)
  const lo = Math.min(0, ...values)
  const hi = Math.max(0.5, ...values)
  const span = hi - lo

  return (
    <Frame>
      <Header enso={enso} trailing={`NOAA CPC · week of ${fmtWeek(enso.weekEnding)}`} />

      <div style={{ display: 'flex', fontFamily: SERIF, fontSize: 56, lineHeight: 1.15, marginTop: 10 }}>
        Ocean state
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 26, marginTop: 8 }}>
        <div
          style={{
            display: 'flex',
            fontFamily: MONO,
            fontSize: 96,
            color: hex(anomalyColor(enso.nino34)),
          }}
        >
          {enso.nino34 > 0 ? '+' : ''}
          {enso.nino34.toFixed(1)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', fontFamily: SERIF, fontSize: 34 }}>
            {nino('Nino 3.4 anomaly, °C')}
          </div>
          <div style={{ display: 'flex', fontFamily: MONO, fontSize: 22, color: INK_SOFT }}>
            ONI {enso.oniSeason ?? '—'}
            {enso.oniValue === null
              ? ''
              : ` ${enso.oniValue > 0 ? '+' : ''}${enso.oniValue.toFixed(1)}`}{' '}
            · {enso.flavor} flavor
          </div>
        </div>
      </div>

      <div
        style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', paddingTop: 18 }}
      >
        <div
          style={{
            display: 'flex',
            fontFamily: MONO,
            fontSize: 18,
            letterSpacing: 2,
            textTransform: 'uppercase',
            color: INK_FAINT,
          }}
        >
          {nino(`Nino 3.4, last ${history.length} weeks`)}
        </div>
        <div
          style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 120, marginTop: 10 }}
        >
          {history.map((h) => (
            <div
              key={h.week}
              style={{
                display: 'flex',
                flexGrow: 1,
                height: Math.max(4, ((h.anomaly - lo) / span) * 120),
                background: hex(anomalyColor(h.anomaly)),
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontFamily: MONO,
            fontSize: 19,
            color: INK_FAINT,
          }}
        >
          <div style={{ display: 'flex' }}>{fmtWeek(history[0]?.week ?? enso.weekEnding)}</div>
          <div style={{ display: 'flex' }}>
            {lo.toFixed(1)} to {hi.toFixed(1)} °C
          </div>
          <div style={{ display: 'flex' }}>{fmtWeek(enso.weekEnding)}</div>
        </div>
      </div>
    </Frame>
  )
}
