import { useEffect, useState } from 'react'
import logo from '../assets/fx/logo.svg'
import starfield from '../assets/fx/starfield-page.svg'
import { HudCorners } from '../components/ui'
import type { State } from '../data/model'
import * as sel from '../data/selectors'
import { useStore } from '../data/useStore'

type Line = { cmd: string; result: string }

function buildLines(state: State, today: Date): Line[] {
  const event = sel.nextEvent(state, today)
  return [
    { cmd: 'booting ANGEL.OS v3.0', result: 'OK' },
    { cmd: 'unfolding wings', result: 'OK' },
    { cmd: 'gathering fabrics', result: 'OK' },
    { cmd: 'threading needles', result: 'OK' },
    { cmd: 'heating up the glue gun', result: 'OK' },
    { cmd: 'brushing wigs', result: 'OK' },
    { cmd: 'checking your budget', result: `${sel.budgetSummary(state, today).remaining} € LEFT` },
    { cmd: 'sorting today’s tasks', result: `${sel.todayTasks(state, today).filter((t) => !t.done).length} PENDING` },
    { cmd: 'syncing convention calendar', result: event ? `J-${event.daysLeft}` : 'CLEAR' },
    { cmd: 'calibrating halo', result: 'OK' },
  ]
}

const CHAR_MS = 9
const LINE_PAUSE_MS = 110
const HOLD_MS = 650
const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

type Props = { onLeave: () => void; onDone: () => void }

/** Terminal-style boot sequence. `onLeave` fires when the fade-out starts, `onDone` when it ends. Any key or click skips. */
export default function BootScreen({ onLeave, onDone }: Props) {
  const { state, today } = useStore()
  const { profile } = state
  const [lines] = useState(() => buildLines(state, today))
  const [line, setLine] = useState(() => (reducedMotion() ? lines.length : 0))
  const [chars, setChars] = useState(0)
  const [leaving, setLeaving] = useState(false)
  const finished = line >= lines.length

  // Typing state machine: one char at a time, short pause between lines.
  useEffect(() => {
    if (finished) {
      const t = setTimeout(() => {
        setLeaving(true)
        onLeave()
      }, HOLD_MS)
      return () => clearTimeout(t)
    }
    const full = lines[line].cmd.length
    const t =
      chars < full
        ? setTimeout(() => setChars((c) => c + 1), CHAR_MS)
        : setTimeout(() => {
            setLine((l) => l + 1)
            setChars(0)
          }, LINE_PAUSE_MS)
    return () => clearTimeout(t)
  }, [line, chars, finished, onLeave, lines])

  useEffect(() => {
    const skip = () => setLine(lines.length)
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [lines.length])

  const progress = finished ? 100 : ((line + chars / lines[line].cmd.length) / lines.length) * 100

  return (
    <div
      role="status"
      aria-label="Chargement de Cosplay Planner"
      onAnimationEnd={(e) => e.target === e.currentTarget && onDone()}
      className={`fixed inset-0 z-50 grid place-items-center bg-page px-6 ${leaving ? 'animate-fade-out' : ''}`}
    >
      <img src={starfield} alt="" className="pointer-events-none absolute inset-0 size-full max-w-none object-cover" />
      <div className="pointer-events-none absolute -top-[300px] left-1/2 h-[700px] w-[900px] -translate-x-1/2 rounded-full bg-radial from-[#6f6cf0]/25 to-transparent" />

      <div className="relative w-full max-w-[620px]">
        <div className="mb-6 flex items-center gap-3">
          <img src={logo} alt="" className="-m-[14px] size-[72px] max-w-none" />
          <div className="ml-4">
            <p className="font-serif text-[26px] leading-none font-medium italic text-chrome">Cosplay Planner</p>
            <p className="mt-1 text-[10px] tracking-[1.4px] text-cyan">[ COSPLAY MANAGER ] · BOOT SEQUENCE</p>
          </div>
        </div>

        <div className="relative border border-glace/26 bg-panel">
          <div className="flex items-center justify-between border-b border-glace/15 px-4 py-[10px] text-[10px] tracking-[1.2px]">
            <span className="text-glace">TERMINAL · ANGEL.OS</span>
            <span className="text-ardoise">[SESSION {String(profile.session).padStart(3, '0')}]</span>
          </div>

          <ol className="min-h-[268px] px-4 py-3 text-[12px] leading-[22px]" aria-live="off">
            {lines.slice(0, line + 1).map((l, i) => {
              const done = i < line
              return (
                <li key={l.cmd} className="flex gap-2">
                  <span className="text-cyan">&gt;&gt;</span>
                  <span className="text-ailes">{done ? l.cmd : l.cmd.slice(0, chars)}</span>
                  {done ? (
                    <>
                      <span className="flex-1 overflow-hidden text-ardoise/60 whitespace-nowrap">{' .'.repeat(40)}</span>
                      <span className="text-cyan">[ {l.result} ]</span>
                    </>
                  ) : (
                    <span className="animate-blink text-cyan">▌</span>
                  )}
                </li>
              )
            })}
            {finished && (
              <li className="mt-2 text-cyan">
                &gt;&gt; HALO SYNC OK — welcome back, {profile.name} <span className="animate-blink">▌</span>
              </li>
            )}
          </ol>

          <div className="border-t border-glace/15 px-4 py-3">
            <div className="flex justify-between text-[10px] tracking-[1.2px]">
              <span className="text-glace">LOADING WORKSHOP</span>
              <span className="text-cyan tabular-nums">{Math.round(progress).toString().padStart(3, '0')} %</span>
            </div>
            <div className="mt-2 h-[6px] rounded-full bg-ailes/9">
              <div className="h-full rounded-full bg-bar" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <HudCorners />
        </div>

        <p className="mt-4 text-center text-[9.5px] tracking-[1.14px] text-ardoise">
          APPUIE SUR UNE TOUCHE POUR PASSER
        </p>
      </div>

      <div className="scanlines pointer-events-none absolute inset-0 [--scan-alpha:0.035] [--scan-gap:3px]" />
    </div>
  )
}
