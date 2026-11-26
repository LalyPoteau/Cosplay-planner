import { useId, useState, type KeyboardEvent } from 'react'

export type Suggestion = { label: string; hint?: string }

type Props = {
  value: string
  onChange: (value: string) => void
  suggestions: Suggestion[]
  /** Called when a suggestion is picked (defaults to onChange) */
  onPick?: (s: Suggestion) => void
  placeholder?: string
  className?: string
  ariaLabel?: string
  max?: number
}

const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Text input that proposes matches only while typing (no permanent list). */
export default function Suggest({ value, onChange, suggestions, onPick, placeholder, className = 'field', ariaLabel, max = 6 }: Props) {
  const id = useId()
  const [focused, setFocused] = useState(false)
  const [active, setActive] = useState(0)

  const q = norm(value.trim())
  const matches = q
    ? suggestions.filter((s) => norm(s.label).includes(q) && norm(s.label) !== q).sort((a, b) => norm(a.label).indexOf(q) - norm(b.label).indexOf(q)).slice(0, max)
    : []
  const open = focused && matches.length > 0

  const pick = (s: Suggestion) => {
    if (onPick) onPick(s)
    else onChange(s.label)
    setActive(0)
  }
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (!open) return
    if (e.key === 'Escape') return setFocused(false)
    const moves: Record<string, () => void> = {
      ArrowDown: () => setActive((i) => (i + 1) % matches.length),
      ArrowUp: () => setActive((i) => (i - 1 + matches.length) % matches.length),
      Enter: () => pick(matches[active]),
      Tab: () => pick(matches[active]),
    }
    const move = moves[e.key]
    if (!move) return
    e.preventDefault()
    move()
  }

  return (
    <div className="relative min-w-0">
      <input
        role="combobox"
        aria-expanded={open}
        aria-controls={id}
        aria-autocomplete="list"
        aria-label={ariaLabel}
        className={`${className} w-full`}
        value={value}
        placeholder={placeholder}
        onChange={(e) => (onChange(e.target.value), setActive(0))}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onKeyDown={onKey}
        autoComplete="off"
      />
      {open && (
        <ul id={id} role="listbox" className="absolute top-full right-0 left-0 z-20 mt-1 border border-cyan/50 bg-[#0d1335] shadow-[0_8px_24px_rgb(10_13_31/0.8)]">
          {matches.map((s, i) => (
            <li
              key={s.label}
              role="option"
              aria-selected={i === active}
              onMouseDown={(e) => (e.preventDefault(), pick(s))}
              onMouseEnter={() => setActive(i)}
              className="flex cursor-pointer items-center justify-between gap-3 px-3 py-[7px] text-[11px] text-ailes aria-selected:bg-cyan/15 aria-selected:text-cyan"
            >
              <span className="truncate">{s.label}</span>
              {s.hint && <span className="shrink-0 text-[9.5px] text-ardoise">{s.hint}</span>}
            </li>
          ))}
          <li className="border-t border-glace/10 px-3 py-1 text-[8.5px] tracking-[0.6px] text-ardoise">↑↓ CHOISIR · ENTRÉE / TAB VALIDER</li>
        </ul>
      )}
    </div>
  )
}
