import type { ReactNode } from 'react'

/** The ruled title + eyebrow pairing used at the top of every section. */
export default function SectionHeader({
  title,
  meta,
}: {
  title: string
  meta?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-baseline justify-between gap-4 border-b border-rule pb-2.5">
      <h2 className="font-serif text-2xl">{title}</h2>
      {meta && <p className="eyebrow text-xs">{meta}</p>}
    </div>
  )
}
