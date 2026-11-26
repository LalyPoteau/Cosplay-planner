import logo from '../assets/fx/logo.svg'
import halo from '../assets/icons/halo.svg'
import eclat from '../assets/icons/eclat.svg'
import cible from '../assets/icons/cible.svg'
import horloge from '../assets/icons/horloge.svg'
import terminal from '../assets/icons/terminal.svg'
import calendrier from '../assets/icons/calendrier.svg'
import stockage from '../assets/icons/stockage.svg'
import type { NavRoute } from '../router'

export const items: { id: NavRoute; label: string; icon: string }[] = [
  { id: 'accueil', label: 'Accueil', icon: halo },
  { id: 'ciel', label: 'Ciel', icon: eclat },
  { id: 'budget', label: 'Budget', icon: cible },
  { id: 'temps', label: 'Temps', icon: horloge },
  { id: 'taches', label: 'Tâches', icon: terminal },
  { id: 'agenda', label: 'Agenda', icon: calendrier },
  { id: 'stockage', label: 'Stock', icon: stockage },
]

type Props = { active: NavRoute; onNavigate: (route: NavRoute) => void }

export default function Sidebar({ active, onNavigate }: Props) {
  return (
    <aside className="fixed inset-y-0 left-0 z-20 flex w-[72px] flex-col items-center border-r border-glace/18 bg-linear-to-b from-[#111949] to-[#080b1a]">
      <button type="button" onClick={() => onNavigate('accueil')} title="Accueil" className="mt-[2px] cursor-pointer transition hover:brightness-125">
        <img src={logo} alt="Cosplay Planner — accueil" className="size-[72px] max-w-none" />
      </button>

      <nav aria-label="Navigation principale" className="mt-[22px] flex w-full flex-col gap-[10px]">
        {items.map(({ id, label, icon }) => {
          const isActive = id === active
          return (
            <button
              key={id}
              type="button"
              aria-current={isActive ? 'page' : undefined}
              onClick={() => onNavigate(id)}
              className="group relative mx-2 flex h-[54px] cursor-pointer flex-col items-center justify-center gap-1 border border-transparent transition hover:bg-glace/5 aria-[current=page]:border-cyan/60 aria-[current=page]:bg-glace/10 aria-[current=page]:shadow-[0_0_12px_rgb(92_242_228/0.25)]"
            >
              {isActive && (
                <span className="absolute top-[10px] -left-[9px] h-[34px] w-[3px] rounded-full bg-cyan shadow-[0_0_8px_rgb(92_242_228/0.9)]" />
              )}
              <img src={icon} alt="" className="size-6" />
              <span
                className={`text-[8.5px] tracking-[0.5px] uppercase ${isActive ? 'text-cyan' : 'text-ardoise group-hover:text-argent'}`}
              >
                {label}
              </span>
            </button>
          )
        })}
      </nav>

      <div className="mt-auto mb-[22px] grid size-11 place-items-center rounded-full border border-cyan/50">
        <div className="size-9 rounded-full border border-ailes/70 bg-linear-to-br from-halo to-[#1b2466]" />
      </div>
    </aside>
  )
}
