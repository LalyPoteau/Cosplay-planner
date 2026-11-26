import { useState, type ReactNode } from 'react'
import aile16 from '../../assets/icons/aile-16.svg'
import cible16 from '../../assets/icons/cible-16.svg'
import horloge16 from '../../assets/icons/horloge-16.svg'
import terminal16 from '../../assets/icons/terminal-16.svg'
import eclat from '../../assets/icons/eclat.svg'
import play from '../../assets/icons/play.svg'
import CosplayIcon from '../../components/CosplayIcon'
import { Button, Chip, Empty, GlitchTitle, HudCorners, ProgressBar } from '../../components/ui'
import { euros, hours, parseDay } from '../../data/model'
import * as sel from '../../data/selectors'
import { useStore } from '../../data/useStore'
import { navigate } from '../../router'
import { useNow } from '../../useNow'
import Mannequin from './Mannequin'
import References, { type RefFilter } from './References'
import { BudgetTab, TasksTab, TimeTab } from './tabs'

type Tab = 'mannequin' | 'refs' | 'budget' | 'temps' | 'taches'
const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'mannequin', label: 'Mannequin', icon: aile16 },
  { id: 'refs', label: 'Références', icon: eclat },
  { id: 'budget', label: 'Budget', icon: cible16 },
  { id: 'temps', label: 'Temps', icon: horloge16 },
  { id: 'taches', label: 'Tâches', icon: terminal16 },
]

/** Fiche d'un cosplay (Figma: B2 · Mannequin du cosplay). */
export default function CosplayFiche({ id, initialTab }: { id: string; initialTab?: string | null }) {
  const { state, today, set, update, startTimer, stopTimer } = useStore()
  const [tab, setTab] = useState<Tab>(() => TABS.find((t) => t.id === initialTab)?.id ?? 'mannequin')
  const [refFilter, setRefFilter] = useState<RefFilter>('all')
  const cosplay = state.cosplays.find((c) => c.id === id)
  const running = !!cosplay && state.timer?.cosplayId === cosplay.id
  const now = useNow(running ? 1000 : null)

  if (!cosplay) {
    return (
      <div className="p-6">
        <Empty>Ce cosplay n’existe plus.</Empty>
        <div className="text-center"><Button onClick={() => navigate('ciel')}>← RETOUR AU CIEL</Button></div>
      </div>
    )
  }

  const progress = sel.cosplayProgress(state, cosplay.id)
  const spent = sel.cosplaySpent(state, cosplay.id)
  const deadline = sel.cosplayDeadline(state, cosplay.id, today)
  const elapsed = running && state.timer ? Math.max(0, Math.floor((now - state.timer.startedAt) / 1000)) : 0
  const isCurrent = state.currentCosplayId === cosplay.id

  const dateLabel = deadline
    ? parseDay(deadline.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
    : null
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

  return (
    <div className="px-6 pt-[22px]">
      {/* breadcrumb + title + actions */}
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <nav aria-label="Fil d’Ariane" className="flex gap-2 text-[10px] font-medium tracking-[1.4px] text-cyan uppercase">
            <button type="button" onClick={() => navigate('ciel')} className="cursor-pointer uppercase hover:underline">Ciel</button>
            <span aria-hidden>/</span>
            <span>{cosplay.series || 'Sans série'}</span>
            <span aria-hidden>/</span>
            <span aria-current="page">{cosplay.name}</span>
          </nav>
          <h1 className="mt-[5px] text-[38px] leading-[46px]"><GlitchTitle>{cosplay.name}</GlitchTitle></h1>
        </div>
        <div className="flex gap-3">
          <Button className={`w-[200px] ${isCurrent ? 'pointer-events-none border-cyan/50 text-cyan' : ''}`} onClick={() => set({ currentCosplayId: cosplay.id })}>
            {isCurrent ? '✦ COSPLAY EN COURS' : '☆ METTRE EN COURS'}
          </Button>
          <Button variant="primary" icon={running ? undefined : play} className="w-[170px]" onClick={() => (running ? stopTimer() : startTimer(cosplay.id))}>
            {running ? `■ STOP · ${clock}` : 'CHRONO'}
          </Button>
        </div>
      </header>

      {/* summary bar */}
      <section className="relative mt-4 grid border border-glace/26 bg-panel lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
        <div className="flex items-center gap-4 px-[14px] py-[11px]">
          <CosplayIcon icon={cosplay.icon} name={cosplay.name} onChange={(icon) => update('cosplays', cosplay.id, { icon })} />
          <div className="min-w-0">
            <Chip>{cosplay.status.toUpperCase()}</Chip>
            <p className="mt-2 truncate text-[10.5px] text-argent">{[cosplay.series, cosplay.version].filter(Boolean).join(' · ') || '—'}</p>
            <p className="truncate text-[10px] text-ardoise" title={deadline?.label}>
              Échéance · {dateLabel ? `${dateLabel} — ${deadline!.label}` : 'aucune'}
            </p>
          </div>
        </div>
        <Stat label="PROGRESSION" value={`${progress} %`}>
          <ProgressBar value={progress} height={5} label="Progression" />
          <p className="text-[9.5px] text-ardoise">{sel.progressSource(sel.cosplayTaskStats(state, cosplay.id), cosplay.status === 'Terminé')}</p>
        </Stat>
        <Stat label="BUDGET" value={cosplay.budget ? `${euros(spent)} / ${euros(cosplay.budget)}` : euros(spent)}>
          {cosplay.budget > 0 ? (
            <ProgressBar value={(spent / cosplay.budget) * 100} height={5} label="Budget du cosplay" />
          ) : (
            <button type="button" onClick={() => setTab('budget')} className="cursor-pointer text-[9.5px] text-ardoise hover:text-cyan">Définir un budget →</button>
          )}
        </Stat>
        <Stat label="TEMPS PASSÉ" value={hours(sel.cosplayMinutes(state, cosplay.id))}>
          <p className="text-[9.5px] text-ardoise">{sel.piecesOf(state, cosplay.id).length} pièces · {state.tasks.filter((t) => t.cosplayId === cosplay.id && !t.done).length} tâches ouvertes</p>
        </Stat>
        <HudCorners />
      </section>

      {/* tabs */}
      <div role="tablist" aria-label="Sections de la fiche" className="mt-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`flex h-9 min-w-[118px] cursor-pointer items-center gap-2 border pr-4 pl-[11px] text-[11px] transition ${
              tab === t.id
                ? 'border-cyan/70 bg-linear-to-r from-halo/40 to-cyan/8 font-medium text-ailes'
                : 'border-glace/25 bg-glace/5 text-argent hover:bg-glace/10'
            }`}
          >
            <img src={t.icon} alt="" className="size-4" />
            {t.label}
          </button>
        ))}
      </div>

      <div className="mt-4 animate-rise" role="tabpanel" key={tab}>
        {tab === 'mannequin' && (
          <Mannequin
            cosplayId={cosplay.id}
            onOpenRefs={(pieceId) => {
              setRefFilter(pieceId)
              setTab('refs')
            }}
          />
        )}
        {tab === 'refs' && <References cosplayId={cosplay.id} filter={refFilter} setFilter={setRefFilter} />}
        {tab === 'budget' && <BudgetTab cosplayId={cosplay.id} />}
        {tab === 'temps' && <TimeTab cosplayId={cosplay.id} />}
        {tab === 'taches' && <TasksTab cosplayId={cosplay.id} />}
      </div>
    </div>
  )
}

function Stat({ label, value, children }: { label: string; value: string; children?: ReactNode }) {
  return (
    <div className="flex flex-col justify-center gap-[6px] border-t border-glace/12 px-5 py-[11px] lg:border-t-0 lg:border-l">
      <p className="label-hud">{label}</p>
      <p className="font-serif text-[22px] leading-none font-medium italic text-chrome">{value}</p>
      {children}
    </div>
  )
}
