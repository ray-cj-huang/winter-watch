import { SOURCES } from '@/lib/sources'

const GROUPS = [
  { kind: 'noaa' as const, title: 'NOAA — live feeds and official products' },
  { kind: 'forecast' as const, title: 'Seasonal forecast commentary' },
  { kind: 'pass' as const, title: 'Pass access' },
]

export default function Sources() {
  return (
    <section className="pt-10">
      <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-rule pb-2.5">
        <h2 className="font-serif text-2xl">Sources</h2>
        <p className="eyebrow">Feeds refresh automatically</p>
      </div>

      {GROUPS.map((g) => {
        const items = SOURCES.filter((s) => s.kind === g.kind)
        if (items.length === 0) return null
        return (
          <div key={g.kind} className="mb-6 last:mb-0">
            <p className="eyebrow mb-2 text-[0.65rem]">{g.title}</p>
            <ol className="flex flex-col">
              {items.map((s, i) => (
                <li
                  key={s.url}
                  className="flex flex-col gap-1 border-b border-rule py-3.5 first:border-t"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="grid h-[19px] w-[19px] place-items-center rounded-sm border border-rule-strong font-mono text-[0.66rem] text-ink-faint">
                      {i + 1}
                    </span>
                    <span className="font-mono text-[0.68rem] uppercase tracking-[0.09em] text-ink-faint">
                      {s.publisher}
                    </span>
                  </div>
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noreferrer"
                    className="font-serif text-[1.06rem] leading-tight underline decoration-rule-strong underline-offset-4 hover:text-accent hover:decoration-accent"
                  >
                    {s.title}
                  </a>
                  <p className="max-w-[58ch] text-[0.86rem] leading-normal text-ink-soft">
                    {s.note}
                  </p>
                </li>
              ))}
            </ol>
          </div>
        )
      })}
    </section>
  )
}
