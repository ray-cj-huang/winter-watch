'use client'

/** The app's one control idiom: a labelled row of mutually exclusive buttons. */
export default function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { id: T; label: string; disabled?: boolean }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="eyebrow text-micro">{label}</span>
      <div role="group" aria-label={label} className="flex flex-wrap gap-1">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            disabled={o.disabled}
            aria-pressed={value === o.id}
            onClick={() => onChange(o.id)}
            className={`border px-3 py-1.5 font-mono text-xs uppercase tracking-wider transition-colors disabled:cursor-not-allowed disabled:text-ink-faint/50 ${
              value === o.id
                ? 'border-ink bg-ink text-paper'
                : 'border-rule bg-surface text-ink-soft hover:bg-surface-sunk'
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  )
}
