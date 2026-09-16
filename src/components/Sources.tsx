import { SOURCES } from '@/lib/sources'
import SectionHeader from './SectionHeader'

const GROUPS = [
  { kind: 'noaa' as const, title: 'NOAA live feeds' },
  { kind: 'forecast' as const, title: 'Seasonal commentary' },
  { kind: 'pass' as const, title: 'Pass access' },
]

/**
 * Table-of-contents layout: one line per source, with a leader rule running
 * to the publisher. Replaces a per-row border and a prose note that mostly
 * restated the title -- the note survives as the link's tooltip.
 */
export default function Sources() {
  return (
    <section className="pt-10">
      <SectionHeader title="Sources" meta="Feeds refresh automatically" />

      {GROUPS.map((group) => {
        const items = SOURCES.filter((s) => s.kind === group.kind)
        if (items.length === 0) return null
        return (
          <div key={group.kind} className="mb-4 last:mb-0">
            <p className="eyebrow mb-0.5 text-xs text-ink-soft">{group.title}</p>
            <ul>
              {items.map((s) => (
                <li key={s.url}>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    title={s.note}
                    className="group flex items-baseline gap-3 py-1 hover:text-accent"
                  >
                    <span className="font-serif text-base leading-snug underline decoration-rule-strong underline-offset-4 group-hover:decoration-accent">
                      {s.title}
                    </span>
                    <span className="h-px grow self-center bg-rule" />
                    <span className="eyebrow shrink-0 text-micro">{s.publisher}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        )
      })}
    </section>
  )
}
