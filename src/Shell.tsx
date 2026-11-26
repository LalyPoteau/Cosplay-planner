import { useEffect, useRef, type ReactNode } from 'react'
import starfield from './assets/fx/starfield-page.svg'
import Sidebar, { items } from './Sidebar/Sidebar'
import { navigate, type NavRoute } from './router'

/** Background, sidebar and CRT overlay shared by every page. */
export default function Shell({ route, title, children }: { route: NavRoute; title?: string; children: ReactNode }) {
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)
  const label = title ?? items.find((i) => i.id === route)?.label
  useEffect(() => {
    document.title = `${label} · Cosplay Planner`
    // Move focus to the new page so screen readers announce it (not on first load)
    if (first.current) first.current = false
    else main.current?.focus({ preventScroll: true })
  }, [label])

  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-page">
      <a
        href="#contenu"
        onClick={(e) => (e.preventDefault(), main.current?.focus())}
        className="fixed top-2 left-2 z-50 -translate-y-20 bg-cyan px-3 py-2 text-[11px] font-semibold text-nuit focus:translate-y-0"
      >
        Aller au contenu
      </a>
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-[405px] left-[216px] h-[810px] w-[1008px] rounded-full bg-radial from-[#6f6cf0]/28 to-transparent" />
        <div className="absolute top-[495px] left-[792px] h-[630px] w-[864px] rounded-full bg-radial from-cyan/9 to-transparent" />
        <img src={starfield} alt="" className="absolute inset-0 size-full max-w-none object-cover" />
      </div>

      <Sidebar active={route} onNavigate={navigate} />
      <main ref={main} id="contenu" tabIndex={-1} className="relative ml-[72px] pb-8 focus:outline-none">{children}</main>

      <div className="scanlines pointer-events-none fixed inset-0 z-30 [--scan-alpha:0.035] [--scan-gap:3px]" />
    </div>
  )
}
