import Link from 'next/link'
import { RESORTS } from '@/lib/resorts'

export default function ResortNotFound() {
  return (
    <div className="mx-auto max-w-[68rem] px-5 pb-12">
      <header className="flex flex-col gap-3.5 border-b-2 border-ink pb-5 pt-11">
        <p className="eyebrow text-xs">404</p>
        <h1 className="text-4xl tracking-tight sm:text-5xl">Not on the roster</h1>
        <p className="font-serif text-lg italic text-ink-soft">
          No destination with that name is on either Ikon tier in this dataset.
        </p>
      </header>
      <p className="pt-8 text-sm text-ink-soft">
        <Link href="/" className="text-accent underline underline-offset-4">
          Browse all {RESORTS.length} destinations
        </Link>
      </p>
    </div>
  )
}
