import type { ReactNode } from 'react'
import starfield from './assets/fx/starfield-page.svg'
import Sidebar from './Sidebar/Sidebar'
import { navigate, type NavRoute } from './router'

/** Background, sidebar and CRT overlay shared by every page. */
export default function Shell({ route, children }: { route: NavRoute; children: ReactNode }) {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-page">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-[405px] left-[216px] h-[810px] w-[1008px] rounded-full bg-radial from-[#6f6cf0]/28 to-transparent" />
        <div className="absolute top-[495px] left-[792px] h-[630px] w-[864px] rounded-full bg-radial from-cyan/9 to-transparent" />
        <img src={starfield} alt="" className="absolute inset-0 size-full max-w-none object-cover" />
      </div>

      <Sidebar active={route} onNavigate={navigate} />
      <main className="relative ml-[72px] pb-8">{children}</main>

      <div className="scanlines pointer-events-none fixed inset-0 z-30 [--scan-alpha:0.035] [--scan-gap:3px]" />
    </div>
  )
}
