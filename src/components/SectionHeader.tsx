import type { ReactNode } from 'react'

/** The ruled title + eyebrow pairing used at the top of every section. */
export default function SectionHeader({
  title,
  meta,
  action,
}: {
  title: string
  meta?: ReactNode
  /** Sits with the meta rather than among the controls, where it would read as one. */
  action?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-rule pb-2.5">
      <h2 className="font-serif text-2xl">{title}</h2>
      {(meta || action) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          {meta && <p className="eyebrow text-xs">{meta}</p>}
          {action}
        </div>
      )}
    </div>
  )
}
