import Link from 'next/link'
import { RESORTS } from '@/lib/resorts'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-[68rem] px-5 pb-12">
      <header className="flex flex-col gap-3.5 border-b-2 border-ink pb-5 pt-11">
        <p className="eyebrow text-xs">404</p>
        <h1 className="text-4xl tracking-tight sm:text-5xl">No such page</h1>
        <p className="font-serif text-lg italic text-ink-soft">
          The link may be truncated, or it may point at something that never existed.
        </p>
      </header>
      <p className="pt-8 text-sm text-ink-soft">
        <Link href="/" className="text-accent underline underline-offset-4">
          Back to the board
        </Link>{' '}
        — {RESORTS.length} destinations ranked against the live NOAA ENSO signal.
      </p>
    </div>
  )
}
