import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import starfield from '../../assets/fx/starfield-page.svg'
import play from '../../assets/icons/play.svg'
import { Button, Chip, GlitchTitle, HudCorners, ProgressBar } from '../../components/ui'
import { daysUntil, euros, hours, iso } from '../../data/model'
import * as sel from '../../data/selectors'
import { useStore } from '../../data/useStore'
import { useNow } from '../../useNow'
import { layoutSky, type Star } from './layout'

// Four-point sparkle, path copied from the Figma star (viewBox 58×58)
const SPARKLE = 'M29 0C30.81 19.94 38.06 27.19 58 29C38.06 30.81 30.81 38.06 29 58C27.19 38.06 19.94 30.81 0 29C19.94 27.19 27.19 19.94 29 0Z'

type Props = {
  visible: Set<string>
  selectedId: string | null
  onSelect: (id: string | null) => void
  onOpen: (id: string) => void
}

export default function Sky({ visible, selectedId, onSelect, onOpen }: Props) {
  const { state, update } = useStore()
  const ref = useRef<HTMLDivElement>(null)
  const [box, setBox] = useState({ w: 1320, h: 728 })
  const [dragPos, setDragPos] = useState<{ id: string; x: number; y: number } | null>(null)
  const drag = useRef<{ id: string; px: number; py: number; ox: number; oy: number; moved: boolean } | null>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setBox({ w: entry.contentRect.width, h: entry.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const constellations = useMemo(
    () => layoutSky(state.cosplays, (id) => sel.cosplayProgress(state, id), box.w, box.h),
    [state, box.w, box.h],
  )
  const pos = (s: Star) => (dragPos?.id === s.cosplay.id ? dragPos : s)
  const selected = constellations.flatMap((c) => c.stars).find((s) => s.cosplay.id === selectedId) ?? null

  // --- drag a star to rearrange the sky (a short click selects it) ---
  const onDown = (e: PointerEvent, s: Star) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    drag.current = { id: s.cosplay.id, px: e.clientX, py: e.clientY, ox: s.x, oy: s.y, moved: false }
  }
  const onMove = (e: PointerEvent) => {
    const d = drag.current
    if (!d) return
    const dx = e.clientX - d.px
    const dy = e.clientY - d.py
    if (!d.moved && Math.hypot(dx, dy) < 4) return
    d.moved = true
    setDragPos({ id: d.id, x: Math.min(box.w - 30, Math.max(30, d.ox + dx)), y: Math.min(box.h - 40, Math.max(50, d.oy + dy)) })
  }
  const onUp = () => {
    const d = drag.current
    drag.current = null
    if (!d) return
    if (d.moved && dragPos) update('cosplays', d.id, { sky: { x: dragPos.x / box.w, y: dragPos.y / box.h } })
    else onSelect(d.id)
    setDragPos(null)
  }

  const moved = state.cosplays.some((c) => c.sky)
  const resetLayout = () => state.cosplays.forEach((c) => c.sky && update('cosplays', c.id, { sky: null }))

  return (
    <div
      ref={ref}
      onClick={() => onSelect(null)}
      className="relative h-[728px] touch-none overflow-hidden border border-glace/26 bg-panel select-none"
    >
      <img src={starfield} alt="" className="pointer-events-none absolute inset-0 size-full max-w-none object-cover opacity-80" />
      <div className="pointer-events-none absolute top-[12%] left-[85%] h-px w-[140px] animate-shoot bg-linear-to-r from-ailes to-transparent opacity-0" />

      {/* header line */}
      <div className="absolute inset-x-0 top-0 flex items-center justify-between pt-3 pr-4 pl-[27px]">
        <span className="absolute top-[17px] left-[15px] size-[5px] rounded-full bg-cyan shadow-[0_0_6px_#5cf2e4]" />
        <span className="text-[10.5px] font-medium tracking-[1.47px] text-glace">CIEL</span>
        <span className="flex items-center gap-4 text-[10px] tracking-[0.8px] text-ardoise">
          1 ÉTOILE = 1 COSPLAY · TAILLE = PROGRESSION
          {moved && (
            <button type="button" onClick={(e) => (e.stopPropagation(), resetLayout())} className="cursor-pointer text-cyan hover:underline">
              ↺ RÉALIGNER
            </button>
          )}
        </span>
      </div>

      {/* constellation lines */}
      <svg className="pointer-events-none absolute inset-0" width={box.w} height={box.h} aria-hidden>
        {constellations.map(({ series, color, stars, closed }) => {
          const pts = stars.map(pos)
          const segments = pts.slice(0, closed ? pts.length : -1).map((a, i) => [a, pts[(i + 1) % pts.length], stars[i], stars[(i + 1) % stars.length]] as const)
          return segments.map(([a, b, sa, sb], i) => {
            const dim = !visible.has(sa.cosplay.id) || !visible.has(sb.cosplay.id)
            const idea = sa.cosplay.status === 'Prévu' || sb.cosplay.status === 'Prévu'
            return (
              <line
                key={`${series}-${i}`}
                x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                stroke={color}
                strokeOpacity={dim ? 0.12 : 0.55}
                strokeWidth={1.2}
                strokeDasharray={idea ? '4 5' : undefined}
                style={{ filter: `drop-shadow(0 0 3px ${color}80)` }}
              />
            )
          })
        })}
      </svg>

      {/* series labels */}
      {constellations.map(({ series, color, stars }) => {
        const pts = stars.map(pos)
        const top = Math.max(44, Math.min(...pts.map((p, i) => p.y - stars[i].size * 1.6)) - 18)
        const label = `${series}  ·  ${stars.length} ${stars.length > 1 ? 'ÉTOILES' : 'ÉTOILE'}`
        const left = Math.min(box.w - label.length * 7 - 16, Math.max(16, Math.min(...pts.map((p) => p.x)) - 30))
        return (
          <p key={series} className="pointer-events-none absolute text-[9px] font-medium tracking-[1.44px] whitespace-nowrap uppercase" style={{ top, left, color }}>
            {label}
          </p>
        )
      })}

      {/* stars */}
      {constellations.flatMap(({ stars }) =>
        stars.map((s) => {
          const { x, y } = pos(s)
          const dim = !visible.has(s.cosplay.id)
          const ring = s.size * 1.9
          const circ = Math.PI * (ring - 2)
          return (
            <div key={s.cosplay.id} className={`absolute transition-opacity duration-300 ${dim ? 'opacity-15' : ''}`} style={{ left: x, top: y }}>
              <span
                className="pointer-events-none absolute -translate-1/2 animate-twinkle rounded-full"
                style={{
                  width: s.size * 3.4,
                  height: s.size * 3.4,
                  background: `radial-gradient(closest-side, ${s.color}52, transparent)`,
                  animationDelay: `${(s.size * 97) % 4000}ms`,
                }}
              />
              {s.progress >= 20 && (
                <svg className="pointer-events-none absolute -translate-1/2" width={ring} height={ring} aria-hidden>
                  <circle cx={ring / 2} cy={ring / 2} r={ring / 2 - 1} fill="none" stroke="#f2f6ff" strokeOpacity={0.12} strokeWidth={2} />
                  <circle
                    cx={ring / 2} cy={ring / 2} r={ring / 2 - 1}
                    fill="none" stroke={s.color} strokeWidth={2} strokeLinecap="round"
                    strokeDasharray={`${(circ * s.progress) / 100} ${circ}`}
                    transform={`rotate(-90 ${ring / 2} ${ring / 2})`}
                    style={{ filter: `drop-shadow(0 0 4px ${s.color}80)` }}
                  />
                </svg>
              )}
              <button
                type="button"
                aria-label={`${s.cosplay.name}, ${s.progress} %`}
                aria-pressed={s.cosplay.id === selectedId}
                onPointerDown={(e) => onDown(e, s)}
                onPointerMove={onMove}
                onPointerUp={onUp}
                onClick={(e) => {
                  e.stopPropagation()
                  if (e.detail === 0) onSelect(s.cosplay.id) // keyboard
                }}
                onDoubleClick={(e) => {
                  e.stopPropagation()
                  onOpen(s.cosplay.id)
                }}
                title="Clic : sélectionner · double-clic : ouvrir la fiche"
                className="absolute -translate-1/2 cursor-grab rounded-full transition-transform hover:scale-110 focus-visible:outline-1 focus-visible:outline-offset-4 focus-visible:outline-cyan active:cursor-grabbing"
                style={{ width: s.size, height: s.size }}
              >
                <svg viewBox="0 0 58 58" className="size-full overflow-visible" style={{ filter: `drop-shadow(0 0 ${s.size * 0.3}px ${s.color}e6)` }}>
                  <path d={SPARKLE} fill="#f2f6ff" />
                </svg>
              </button>
              <span className="pointer-events-none absolute font-serif text-[11px] italic" style={{ left: s.size * 0.7, top: -s.size * 0.9 - 6, color: s.color }}>
                {s.greek}
              </span>
              <span className="pointer-events-none absolute -translate-x-1/2 text-center whitespace-nowrap" style={{ top: s.size * 0.85 + 2 }}>
                <span className="block text-[10.5px] font-medium text-ailes">{s.cosplay.name}</span>
                <span className="block text-[9.5px]" style={{ color: s.color }}>{s.progress} %</span>
              </span>
            </div>
          )
        }),
      )}

      {/* selection brackets */}
      {selected && (() => {
        const { x, y } = pos(selected)
        const box = Math.max(70, selected.size * 2.14)
        return (
          <div className="pointer-events-none absolute" style={{ left: x - box / 2, top: y - box / 2, width: box, height: box }}>
            <span className="absolute -top-[22px] -left-px bg-cyan/95 px-[7px] py-[3px] text-[8.5px] font-medium tracking-[0.7px] text-nuit">SÉLECTION</span>
            {['top-0 left-0 border-t-2 border-l-2', 'top-0 right-0 border-t-2 border-r-2', 'bottom-0 left-0 border-b-2 border-l-2', 'bottom-0 right-0 border-b-2 border-r-2'].map((c) => (
              <span key={c} className={`absolute size-4 border-cyan ${c}`} />
            ))}
          </div>
        )
      })()}

      <p className="pointer-events-none absolute bottom-5 left-6 text-[9px] tracking-[0.9px] whitespace-pre text-ardoise">
        {'LIGNE = MÊME SÉRIE   ·   COULEUR = SÉRIE   ·   ANNEAU = PROGRESSION   ·   POINTILLÉ = PRÉVU   ·   GLISSER = DÉPLACER   ·   DOUBLE-CLIC = OUVRIR'}
      </p>

      {selected && <StarCard star={selected} onOpen={() => onOpen(selected.cosplay.id)} onClose={() => onSelect(null)} />}
      <HudCorners />
    </div>
  )
}

function StarCard({ star, onOpen, onClose }: { star: Star; onOpen: () => void; onClose: () => void }) {
  const { state, today, startTimer, stopTimer } = useStore()
  const c = star.cosplay
  const event = state.events.filter((e) => e.cosplayId === c.id && e.date >= iso(today)).sort((a, b) => a.date.localeCompare(b.date))[0]
  const running = state.timer?.cosplayId === c.id
  const now = useNow(running ? 1000 : null)
  const elapsed = running && state.timer ? Math.max(0, Math.floor((now - state.timer.startedAt) / 1000)) : 0
  const facts = [
    sel.progressSource(sel.cosplayPartStats(state, c.id), c.status === 'Fini'),
    event && `${event.name} · J-${daysUntil(event.date, today)}`,
    `${euros(sel.cosplaySpent(state, c.id))} dépensés`,
    hours(sel.cosplayMinutes(state, c.id)),
  ].filter(Boolean)

  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className="absolute right-5 bottom-5 w-[360px] animate-rise border border-glace/26 bg-linear-to-b from-[#1f2a6e]/95 to-[#0d1335]/95 shadow-[0_0_24px_rgb(143_140_255/0.18)]"
    >
      <div className="flex items-center justify-between pt-3 pr-3 pl-[27px]">
        <span className="absolute top-[17px] left-[15px] size-[5px] rounded-full bg-cyan shadow-[0_0_6px_#5cf2e4]" />
        <span className="text-[10.5px] font-medium tracking-[1.47px] text-glace">ÉTOILE SÉLECTIONNÉE</span>
        <span className="flex items-center gap-2">
          <span className="font-serif text-[13px] italic" style={{ color: star.color }}>{star.greek}</span>
          <button type="button" aria-label="Fermer" onClick={onClose} className="cursor-pointer px-1 text-ardoise hover:text-ailes">✕</button>
        </span>
      </div>
      <div className="px-5 pt-2 pb-5">
        <p className="text-[28px] leading-[34px]"><GlitchTitle>{c.name}</GlitchTitle></p>
        <p className="text-[10px] text-argent">{c.series} · {c.version || '—'}</p>
        <div className="mt-3 flex items-center gap-2">
          <Chip>{c.status.toUpperCase()}</Chip>
          <span className="ml-auto text-[12px] font-medium" style={{ color: star.color }}>{star.progress} %</span>
        </div>
        <div className="mt-3"><ProgressBar value={star.progress} label={`Avancement ${c.name}`} /></div>
        <p className="mt-3 text-[10.5px] text-argent">{facts.join('  ·  ')}</p>
        <div className="mt-4 grid grid-cols-2 gap-[10px]">
          <Button variant="primary" className="px-0" onClick={onOpen}>→ OUVRIR LA FICHE</Button>
          <Button icon={running ? undefined : play} className="px-0" onClick={() => (running ? stopTimer() : startTimer(c.id))}>
            {running ? `■ ${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}` : 'CHRONO'}
          </Button>
        </div>
      </div>
      <HudCorners />
    </div>
  )
}
