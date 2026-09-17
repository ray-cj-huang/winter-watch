'use client'

import { useEffect, useState } from 'react'

const BUTTON =
  'border border-rule bg-surface px-3 py-1.5 font-mono text-xs uppercase tracking-wider text-ink-soft transition-colors hover:bg-surface-sunk'

/**
 * Copy the current view, or download its card.
 *
 * @remarks
 * - The address bar tracks the controls, so a copy is what is on screen.
 * - The download exists because not everywhere people paste links unfurls.
 */
export default function ShareLink({
  cardUrl,
  href,
  label,
}: {
  cardUrl: string
  /** Copy this instead of the address bar, for a view the controls do not own. */
  href?: string
  label?: string
}) {
  const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 2500)
    return () => clearTimeout(timer)
  }, [state])

  async function copy() {
    try {
      const target = href ? new URL(href, window.location.origin).toString() : window.location.href
      await navigator.clipboard.writeText(target)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && <span className="eyebrow text-micro">{label}</span>}
      <div className="flex flex-wrap gap-1">
        <button type="button" onClick={copy} className={BUTTON}>
          {state === 'copied' ? 'Copied' : state === 'failed' ? 'Use address bar' : 'Copy link'}
        </button>
        <a href={cardUrl} download className={BUTTON}>
          Card ↓
        </a>
      </div>
    </div>
  )
}
