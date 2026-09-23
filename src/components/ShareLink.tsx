'use client'

import { useEffect, useState } from 'react'

/** An arrow leaving a tray: the glyph a share control is expected to carry. */
function ShareIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
      className="shrink-0"
    >
      <path
        d="M8 1.75v8M8 1.75 5.25 4.5M8 1.75 10.75 4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3.25 8.25v5h9.5v-5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

type State = 'idle' | 'copied' | 'failed'

const LABEL: Record<State, string> = {
  idle: 'Share',
  copied: 'Link copied',
  failed: 'Use address bar',
}

/**
 * Share the current view, or save its card.
 *
 * @remarks
 * - One button, because a share sheet is what people reach for on a phone.
 * - Falls back to the clipboard where the browser has no sheet to open.
 * - The address bar tracks the controls, so a share is what is on screen.
 */
export default function ShareLink({
  cardUrl,
  href,
  title,
}: {
  cardUrl: string
  /** Share this instead of the address bar, for a view the controls do not own. */
  href?: string
  title?: string
}) {
  const [state, setState] = useState<State>('idle')

  useEffect(() => {
    if (state === 'idle') return
    const timer = setTimeout(() => setState('idle'), 2500)
    return () => clearTimeout(timer)
  }, [state])

  async function share() {
    const url = href ? new URL(href, window.location.origin).toString() : window.location.href

    if (navigator.share) {
      try {
        await navigator.share({ title: title ?? document.title, url })
        return
      } catch (error) {
        // Dismissing the sheet is a decision, not a failure to fall back from.
        if ((error as Error).name === 'AbortError') return
      }
    }

    try {
      await navigator.clipboard.writeText(url)
      setState('copied')
    } catch {
      setState('failed')
    }
  }

  return (
    <span className="inline-flex items-center gap-3">
      <button
        type="button"
        onClick={share}
        className="inline-flex items-center gap-1.5 border border-rule bg-surface px-2.5 py-1 font-mono text-micro uppercase tracking-wider text-ink-soft transition-colors hover:bg-surface-sunk"
      >
        <ShareIcon />
        {LABEL[state]}
      </button>
      <a
        href={cardUrl}
        download
        className="font-mono text-micro uppercase tracking-wider text-ink-faint underline underline-offset-4 transition-colors hover:text-accent"
      >
        Save image
      </a>
    </span>
  )
}
