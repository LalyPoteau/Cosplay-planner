import { useState } from 'react'
import { Panel } from '../../components/ui'
import { addDays, iso, startOfWeek } from '../../data/model'
import * as sel from '../../data/selectors'
import { useStore } from '../../data/useStore'

const WEEKDAYS = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM']
const MAX_ITEMS = 3

type Props = { selectedDay: string; onPickDay: (day: string) => void }

/** Month grid with events and task deadlines. Clicking a day picks it for the "new event" form. */
export default function Calendar({ selectedDay, onPickDay }: Props) {
  const { state, today } = useStore()
  const [month, setMonth] = useState(() => new Date(today.getFullYear(), today.getMonth(), 1))

  const first = startOfWeek(month)
  const days = Array.from({ length: 42 }, (_, i) => addDays(first, i))
  const todayIso = iso(today)
  const title = month.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })
  const shift = (n: number) => setMonth((m) => new Date(m.getFullYear(), m.getMonth() + n, 1))

  const itemsOn = (day: string) => [
    ...state.events.filter((e) => e.date === day).map((e) => ({ id: e.id, kind: 'event' as const, label: e.name, sub: sel.cosplayName(state, e.cosplayId), done: false })),
    ...state.tasks.filter((t) => t.due === day).map((t) => ({ id: t.id, kind: 'task' as const, label: t.title, sub: sel.cosplayName(state, t.cosplayId), done: t.done })),
  ]

  return (
    <Panel title="CALENDRIER" tag="[ÉVÉNEMENTS + ÉCHÉANCES]">
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 pt-3">
        <p className="font-serif text-[30px] leading-none font-medium italic text-chrome capitalize">{title}</p>
        <div className="flex items-center gap-2">
          <NavButton label="Mois précédent" onClick={() => shift(-1)}>‹</NavButton>
          <button
            type="button"
            onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}
            className="h-8 cursor-pointer border border-glace/50 bg-glace/7 px-3 text-[10px] font-medium tracking-[0.8px] text-ailes hover:bg-glace/15"
          >
            AUJOURD’HUI
          </button>
          <NavButton label="Mois suivant" onClick={() => shift(1)}>›</NavButton>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-px px-4 pt-4 pb-2">
        {WEEKDAYS.map((d) => (
          <span key={d} className="pb-2 text-center label-hud">{d}</span>
        ))}
      </div>

      <div className="mx-4 mb-4 grid grid-cols-7 gap-px border border-glace/15 bg-glace/15" role="grid" aria-label={title}>
        {days.map((date) => {
          const day = iso(date)
          const inMonth = date.getMonth() === month.getMonth()
          const isToday = day === todayIso
          const isPicked = day === selectedDay
          const items = itemsOn(day)
          return (
            <button
              key={day}
              type="button"
              role="gridcell"
              aria-label={`${date.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}${items.length ? `, ${items.length} élément(s)` : ''}`}
              aria-selected={isPicked}
              onClick={() => onPickDay(day)}
              className={`group relative flex min-h-[104px] cursor-pointer flex-col gap-1 p-[6px] text-left transition ${
                inMonth ? 'bg-[#121a45]/90 hover:bg-[#1b2563]' : 'bg-nuit/80 hover:bg-[#121a45]'
              } ${isPicked ? 'outline-1 -outline-offset-1 outline-cyan/80' : ''}`}
            >
              <span
                className={`grid size-6 place-items-center text-[11px] ${
                  isToday
                    ? 'rounded-full bg-cyan font-semibold text-nuit shadow-[0_0_10px_rgb(92_242_228/0.6)]'
                    : inMonth
                      ? 'text-ailes'
                      : 'text-ardoise/60'
                }`}
              >
                {date.getDate()}
              </span>
              {items.slice(0, MAX_ITEMS).map((it) =>
                it.kind === 'event' ? (
                  <span key={it.id} title={`${it.label} · ${it.sub}`} className="truncate border-l-2 border-cyan bg-cyan/15 px-[5px] py-[2px] text-[9.5px] font-medium text-cyan">
                    ✦ {it.label}
                  </span>
                ) : (
                  <span
                    key={it.id}
                    title={`${it.label} · ${it.sub}`}
                    className={`truncate px-[5px] text-[9px] ${it.done ? 'text-ardoise line-through' : day < todayIso ? 'text-glitch' : 'text-glace'}`}
                  >
                    ◆ {it.label}
                  </span>
                ),
              )}
              {items.length > MAX_ITEMS && <span className="px-[5px] text-[9px] text-ardoise">+{items.length - MAX_ITEMS} autres</span>}
              <span className="absolute top-[6px] right-[6px] text-[13px] text-cyan opacity-0 transition group-hover:opacity-100" aria-hidden>
                +
              </span>
            </button>
          )
        })}
      </div>

      <p className="px-4 pb-4 text-[9px] tracking-[0.9px] whitespace-pre text-ardoise">
        {'✦ ÉVÉNEMENT   ·   ◆ ÉCHÉANCE DE TÂCHE   ·   ROUGE = EN RETARD   ·   CLIQUER UN JOUR = AJOUTER UN ÉVÉNEMENT'}
      </p>
    </Panel>
  )
}

function NavButton({ label, onClick, children }: { label: string; onClick: () => void; children: string }) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className="grid size-8 cursor-pointer place-items-center border border-glace/50 bg-glace/7 text-[16px] text-ailes hover:border-cyan/60 hover:text-cyan"
    >
      {children}
    </button>
  )
}
