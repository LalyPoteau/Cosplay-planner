import type { ReactNode } from 'react'
import dotGlow from '../assets/fx/dot-glow.svg'
import chipDot from '../assets/fx/chip-dot.svg'

/** Cyan HUD corner brackets (Figma: FX / HUD coins). Parent must be `relative`. */
export function HudCorners() {
  const corner = 'pointer-events-none absolute size-[14px] border-cyan drop-shadow-[0_0_4px_rgb(92_242_228/0.6)]'
  return (
    <>
      <span className={`${corner} -top-[2px] -left-[2px] border-t-2 border-l-2`} />
      <span className={`${corner} -top-[2px] -right-[2px] border-t-2 border-r-2`} />
      <span className={`${corner} -bottom-[2px] -left-[2px] border-b-2 border-l-2`} />
      <span className={`${corner} -bottom-[2px] -right-[2px] border-b-2 border-r-2`} />
    </>
  )
}

type PanelProps = { title: string; tag?: string; className?: string; children: ReactNode }

export function Panel({ title, tag, className = '', children }: PanelProps) {
  return (
    <section className={`relative flex flex-col border border-glace/26 bg-panel ${className}`}>
      <header className="relative flex items-center justify-between pt-3 pr-4 pl-[27px]">
        <img src={dotGlow} alt="" className="absolute top-[10px] left-[9px] size-[17px] max-w-none" />
        <h2 className="text-[10.5px] font-medium tracking-[1.47px] text-glace">{title}</h2>
        {tag && <span className="text-[10px] tracking-[0.8px] text-ardoise">{tag}</span>}
      </header>
      {children}
      <HudCorners />
    </section>
  )
}

/** Serif title with soft red/cyan glitch ghosts behind a chrome gradient. */
export function GlitchTitle({ children, className = '' }: { children: string; className?: string }) {
  return (
    <span className={`relative inline-block font-serif font-medium italic ${className}`}>
      <span aria-hidden className="absolute top-0 -left-[1.5px] w-full text-glitch/30">{children}</span>
      <span aria-hidden className="absolute top-0 left-[1.5px] w-full text-cyan/30">{children}</span>
      <span className="relative text-chrome">{children}</span>
    </span>
  )
}

export function Chip({ children, tone = 'cyan' }: { children: ReactNode; tone?: 'cyan' | 'glace' }) {
  const styles =
    tone === 'cyan'
      ? 'border-cyan/55 bg-cyan/12 pl-[7px] text-cyan'
      : 'border-glace/55 bg-glace/12 pl-[10px] text-glace'
  return (
    <span className={`inline-flex h-[22px] items-center gap-[3px] border pr-[9px] text-[10px] font-medium tracking-[0.8px] ${styles}`}>
      {tone === 'cyan' && <img src={chipDot} alt="" className="size-1" />}
      {children}
    </span>
  )
}

export function ProgressBar({ value, height = 6, label }: { value: number; height?: number; label: string }) {
  const pct = Math.max(0, Math.min(100, value))
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuenow={Math.round(pct)}
      aria-valuemin={0}
      aria-valuemax={100}
      className="w-full rounded-full bg-ailes/9"
      style={{ height }}
    >
      <div className="h-full rounded-full bg-bar transition-[width] duration-700" style={{ width: `${pct}%` }} />
    </div>
  )
}

type ButtonProps = {
  children: ReactNode
  icon?: string
  variant?: 'primary' | 'ghost'
  className?: string
  onClick?: () => void
  type?: 'button' | 'submit'
}

export function Button({ children, icon, variant = 'ghost', className = '', onClick, type = 'button' }: ButtonProps) {
  const styles =
    variant === 'primary'
      ? 'bg-btn-primary text-nuit hover:brightness-110'
      : 'border border-glace/50 bg-glace/7 text-ailes hover:bg-glace/15'
  return (
    <button
      type={type}
      onClick={onClick}
      className={`inline-flex h-10 cursor-pointer items-center justify-center gap-[7px] px-[18px] whitespace-nowrap text-[11.5px] font-semibold tracking-[0.575px] transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan ${styles} ${className}`}
    >
      {icon && <img src={icon} alt="" className="size-[15px]" />}
      {children}
    </button>
  )
}

/** Header used by the inner pages (the dashboard has its own banner). */
export function PageHeader({ code, title, subtitle, children }: { code: string; title: string; subtitle: string; children?: ReactNode }) {
  return (
    <header className="relative flex flex-wrap items-end justify-between gap-4 border-b border-glace/15 px-6 pt-8 pb-6">
      <div>
        <p className="text-[10px] font-medium tracking-[1.4px] text-cyan">[ COSPLAY MANAGER ]  ·  {code}</p>
        <h1 className="mt-2 text-[34px] leading-[41px]">
          <GlitchTitle>{title}</GlitchTitle>
        </h1>
        <p className="mt-1 text-[11px] text-argent">{subtitle}</p>
      </div>
      {children}
      <div className="absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-cyan/80 via-glace/40 to-halo/0" />
    </header>
  )
}

/** Labelled form control wrapper. */
export function Field({ label, children, className = '' }: { label: string; children: ReactNode; className?: string }) {
  return (
    <label className={`flex flex-col gap-1 ${className}`}>
      <span className="label-hud">{label}</span>
      {children}
    </label>
  )
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-6 text-center text-[11px] text-ardoise">{children}</p>
}

export function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className="grid size-7 shrink-0 cursor-pointer place-items-center text-[13px] text-ardoise transition hover:text-glitch focus-visible:outline-1 focus-visible:outline-cyan"
    >
      {children}
    </button>
  )
}
