import { useEffect, useRef } from 'react'
import wings from '../assets/fx/wings-banner.svg'
import haloRing from '../assets/fx/halo-banner.svg'
import starfield from '../assets/fx/starfield-banner.svg'
import notifDot from '../assets/fx/notif-dot.svg'
import loupe from '../assets/icons/loupe.svg'
import cloche from '../assets/icons/cloche.svg'
import { GlitchTitle } from '../components/ui'
import { useStore } from '../data/useStore'

export default function Banner({ today }: { today: Date }) {
  const search = useRef<HTMLInputElement>(null)
  const { profile } = useStore().state

  // ⌘K / Ctrl+K focuses the search field
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        search.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const date = today
    .toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
    .toUpperCase()

  return (
    <header className="relative h-[190px] overflow-hidden bg-linear-[181deg] from-[#2b3190] from-7% via-[#151c60] to-[#0a0f33] to-93%">
      <img src={wings} alt="" className="pointer-events-none absolute top-[6px] left-[calc(50%+16px)] h-[200px] w-[900px] max-w-none -translate-x-1/2" />
      <img src={haloRing} alt="" className="pointer-events-none absolute -top-[4.8px] left-[calc(50%+16px)] h-[77.6px] w-[221.6px] max-w-none -translate-x-1/2" />
      <img src={starfield} alt="" className="pointer-events-none absolute inset-0 size-full max-w-none" />
      <div className="scanlines pointer-events-none absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-linear-to-r from-cyan/80 via-glace/40 to-halo/0" />

      <div className="relative px-8 pt-[26px]">
        <p className="text-[10px] font-medium tracking-[1.4px] whitespace-pre text-cyan">
          {`[ COSPLAY MANAGER ]  ·  SESSION ${String(profile.session).padStart(3, '0')}`}
        </p>
        <h1 className="mt-[11px] text-[34px] leading-[41px]">
          <GlitchTitle>Prends ton envol, pièce après pièce.</GlitchTitle>
        </h1>
        <p className="mt-[21px] text-[10.5px] tracking-[1.05px] text-argent uppercase">{profile.roles}</p>
      </div>

      <div className="absolute top-5 right-8 flex items-center">
        <label className="relative hidden h-[34px] w-[300px] items-center rounded-full border border-glace/40 bg-nuit/40 md:flex">
          <img src={loupe} alt="" className="absolute left-[13px] size-4" />
          <input
            ref={search}
            type="search"
            aria-label="Rechercher un cosplay, une tâche"
            placeholder="Rechercher un cosplay, une tâche…"
            className="size-full bg-transparent pr-10 pl-[37px] text-[10.5px] text-ailes outline-none placeholder:text-argent focus-visible:rounded-full focus-visible:ring-1 focus-visible:ring-cyan/60"
          />
          <kbd aria-hidden className="absolute right-[12px] text-[10px] text-ardoise">⌘K</kbd>
        </label>
        <button type="button" aria-label="Notifications (1 nouvelle)" className="relative ml-5 size-5 cursor-pointer">
          <img src={cloche} alt="" className="size-5" />
          <img src={notifDot} alt="" className="absolute -top-[8px] left-[9px] size-[19px] max-w-none" />
        </button>
        <time dateTime={today.toISOString().slice(0, 10)} className="ml-[95px] text-[10px] tracking-[0.8px] text-argent">
          {date}
        </time>
      </div>
    </header>
  )
}
