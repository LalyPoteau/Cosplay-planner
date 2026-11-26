import aile from '../assets/icons/aile.svg'
import cibleTile from '../assets/icons/cible-tile.svg'
import horlogeTile from '../assets/icons/horloge-tile.svg'
import terminalTile from '../assets/icons/terminal-tile.svg'
import calendrierTile from '../assets/icons/calendrier-tile.svg'
import fleche from '../assets/icons/fleche.svg'
import camera from '../assets/icons/camera.svg'
import play from '../assets/icons/play.svg'
import check from '../assets/icons/check.svg'
import wingsCard from '../assets/fx/wings-card.svg'
import { Button, Chip, Empty, GlitchTitle, Panel, ProgressBar } from '../components/ui'
import { euros, hours, parseDay, taskMeta, type Task } from '../data/model'
import * as sel from '../data/selectors'
import { useStore } from '../data/useStore'
import { navigate, openCosplay, type Route } from '../router'
import { useNow } from '../useNow'

export function QuickAccess({ className = '' }: { className?: string }) {
  const { state, today, exportJson } = useStore()
  const event = sel.nextEvent(state, today)
  const links: { label: string; detail: string; icon: string; to: Route }[] = [
    { label: 'Cosplays', detail: `${state.cosplays.length} projets`, icon: aile, to: 'ciel' },
    { label: 'Budget', detail: `${euros(sel.budgetSummary(state, today).remaining)} disponibles`, icon: cibleTile, to: 'budget' },
    { label: 'Temps', detail: `${Math.round(sel.monthMinutes(state, today) / 60)} h ce mois`, icon: horlogeTile, to: 'temps' },
    { label: 'Tâches', detail: `${sel.openTasks(state)} à terminer`, icon: terminalTile, to: 'taches' },
    { label: 'Agenda', detail: event ? `${event.event.name} · J-${event.daysLeft}` : 'Rien de prévu', icon: calendrierTile, to: 'agenda' },
  ]
  return (
    <Panel title="ACCÈS RAPIDE" tag={`[${String(links.length + 1).padStart(2, '0')}]`} className={className}>
      <ul className="mt-[22px] flex flex-col gap-[10px] px-[11px]">
        {links.map(({ label, detail, icon, to }) => (
          <li key={label}>
            <button
              type="button"
              onClick={() => navigate(to)}
              className="group flex h-[78px] w-full cursor-pointer items-center border border-glace/18 bg-glace/5 px-[11px] text-left transition hover:border-cyan/50 hover:bg-glace/10"
            >
              <span className="grid size-12 shrink-0 place-items-center border border-glace/45 bg-tile">
                <img src={icon} alt="" className="size-[26px]" />
              </span>
              <span className="ml-3 flex-1">
                <span className="block text-[13px] font-medium text-ailes">{label}</span>
                <span className="mt-[5px] block text-[10.5px] text-argent">{detail}</span>
              </span>
              <img src={fleche} alt="" className="size-[14px] transition group-hover:translate-x-0.5" />
            </button>
          </li>
        ))}
      </ul>
      <footer className="mt-auto px-[15px] pb-3">
        <p className="label-hud">Sauvegarde locale</p>
        <button type="button" onClick={exportJson} className="mt-2 cursor-pointer transition hover:brightness-125" title="Télécharger une copie JSON">
          <Chip>EXPORT JSON · {state.lastExport ? 'OK' : 'À FAIRE'}</Chip>
        </button>
        <p className="mt-2 text-[10px] text-argent">Dernière copie : {state.lastExport ?? 'jamais'}</p>
      </footer>
    </Panel>
  )
}

export function CurrentCosplay() {
  const { state, today, startTimer, stopTimer } = useStore()
  const current = sel.currentCosplay(state, today)
  const timer = state.timer
  const now = useNow(timer ? 1000 : null)

  if (!current) {
    return (
      <Panel title="COSPLAY EN COURS" className="h-full">
        <Empty>Aucun cosplay en cours. Choisis-en un dans le Ciel des projets.</Empty>
      </Panel>
    )
  }
  const { cosplay: c, nextTask } = current
  const running = timer?.cosplayId === c.id
  const elapsed = running ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0
  const clock = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`

  return (
    <Panel title="COSPLAY EN COURS" tag={`${String(current.position).padStart(2, '0')} / ${String(current.total).padStart(2, '0')}`}>
      <div className="flex gap-5 px-[15px] pt-[17px] pb-4">
        {/* Photo drop zone — will hold the cosplay picture once storage exists */}
        <div className="relative size-60 shrink-0 overflow-hidden border border-glace/45 bg-linear-[240deg] from-[#2a3380] from-13% to-[#0b1030] to-87%">
          <div className="absolute inset-0 bg-linear-[250deg] from-halo/35 from-11% to-cyan/12 to-89%" />
          {c.icon ? (
            <img src={c.icon} alt={c.name} className="absolute inset-0 size-full object-cover" />
          ) : (
            <img src={wingsCard} alt="" className="absolute top-[29px] -left-[41px] h-[200px] w-[320px] max-w-none" />
          )}
          <div className="scanlines absolute inset-0" />
          {[
            'top-2 left-2 border-t-[1.6px] border-l-[1.6px]',
            'top-2 right-2 border-t-[1.6px] border-r-[1.6px]',
            'bottom-2 left-2 border-b-[1.6px] border-l-[1.6px]',
            'bottom-2 right-2 border-b-[1.6px] border-r-[1.6px]',
          ].map((pos) => (
            <span key={pos} className={`absolute size-[14px] border-cyan/90 ${pos}`} />
          ))}
          <p className="absolute top-[13px] left-[15px] text-[9.5px] font-medium tracking-[1.33px] text-cyan">
            IMAGE · {c.name.toUpperCase()}
          </p>
          {!c.icon && (
            <>
              <img src={camera} alt="" className="absolute top-[95px] left-[103px] size-8" />
              <button
                type="button"
                onClick={() => openCosplay(c.id)}
                className="absolute top-[131px] left-[15px] flex h-6 w-[208px] cursor-pointer items-center justify-center rounded-full bg-nuit/60 text-[10.5px] tracking-[0.63px] text-argent hover:text-cyan"
              >
                Ajouter une icône
              </button>
            </>
          )}
        </div>

        <div className="flex min-w-0 flex-1 flex-col">
          <p className="mt-[6px] text-[10px] font-medium tracking-[1.2px] text-cyan uppercase">
            {c.series} · {c.version}
          </p>
          <h3 className="mt-[5px] text-[38px] leading-[46px]">
            <GlitchTitle>{c.name}</GlitchTitle>
          </h3>
          <div className="mt-[6px] flex gap-1">
            <Chip>{c.status.toUpperCase()}</Chip>
            <Chip tone="glace">{current.progress} %</Chip>
          </div>
          <div className="mt-4">
            <ProgressBar value={current.progress} label={`Avancement ${c.name}`} />
            <p className="mt-1 text-right text-[9px] text-ardoise">{sel.progressSource(sel.cosplayTaskStats(state, c.id), c.status === 'Terminé')}</p>
          </div>
          <p className="mt-[2px] label-hud">Prochaine étape</p>
          <p className="mt-1 text-[14px] font-medium text-ailes">{nextTask?.title ?? 'Tout est fait ✦'}</p>
          <p className="mt-1 text-[10.5px] text-rose">
            {current.dueInDays === null ? 'Pas d’échéance' : current.dueInDays < 0 ? `En retard de ${-current.dueInDays} j` : `Échéance dans ${current.dueInDays} jours`}
          </p>
          <div className="mt-auto flex gap-[10px]">
            <Button variant="primary" icon={play} className="w-[166px] px-0" onClick={() => (running ? stopTimer() : startTimer(c.id))}>
              {running ? `STOP · ${clock}` : `REPRENDRE${nextTask?.estimateMin ? ` · ${nextTask.estimateMin} MIN` : ''}`}
            </Button>
            <Button className="w-[148px] px-0" onClick={() => openCosplay(c.id)}>
              OUVRIR LA FICHE
            </Button>
          </div>
        </div>
      </div>
    </Panel>
  )
}

export function NextEvent() {
  const { state, today } = useStore()
  const next = sel.nextEvent(state, today)
  const date = next ? parseDay(next.event.date) : null
  return (
    <Panel title="PROCHAIN ÉVÉNEMENT" tag="[AGENDA]" className="h-[140px]">
      {next && date ? (
        <div className="flex items-start px-[15px] pt-[17px]">
          <div className="flex h-[76px] w-[68px] shrink-0 flex-col items-center border border-glace/50 bg-linear-[243deg] from-[#3a3fb0]/70 from-13% to-[#10163f] to-87%">
            <span className="mt-[9px] font-serif text-[34px] leading-[41px] font-medium italic text-chrome">
              {next.event.date.slice(8, 10)}
            </span>
            <span className="mt-[3px] text-[9.5px] font-medium tracking-[1.33px] text-cyan">
              {date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase()}
            </span>
          </div>
          <div className="ml-4 flex-1">
            <p className="mt-[3px] text-[16px] font-medium text-ailes">{next.event.name}</p>
            <p className="mt-[3px] text-[10.5px] text-argent">
              {next.event.city} · {sel.cosplayName(state, next.event.cosplayId)}
            </p>
            <div className="mt-[10px] flex items-center justify-between">
              <Chip>J-{next.daysLeft}</Chip>
              <button type="button" aria-label="Ouvrir l’agenda" onClick={() => navigate('agenda')} className="cursor-pointer p-1">
                <img src={fleche} alt="" className="size-[14px]" />
              </button>
            </div>
          </div>
        </div>
      ) : (
        <Empty>Aucun événement à venir.</Empty>
      )}
    </Panel>
  )
}

export function BudgetLeft() {
  const { state, today } = useStore()
  const b = sel.budgetSummary(state, today)
  return (
    <Panel title="BUDGET RESTANT" tag={`[${b.month}]`} className="h-[144px]">
      <div className="px-[15px]">
        <div className="mt-[10px] flex items-baseline justify-between">
          <span className={`font-serif text-[44px] leading-[53px] font-medium italic ${b.remaining < 0 ? 'text-glitch' : 'text-chrome'}`}>
            {euros(b.remaining)}
          </span>
          <span className="text-[9.5px] tracking-[0.76px] whitespace-pre text-ardoise">
            {`PAYÉ ${euros(b.paid)}   ·   ENGAGÉ ${euros(b.committed)}`}
          </span>
        </div>
        <p className="-mt-[1px] text-[10.5px] text-argent">sur {euros(b.target)} de budget cible</p>
        <div className="mt-[6px]">
          <ProgressBar value={b.usedPercent} label="Budget engagé" />
        </div>
      </div>
    </Panel>
  )
}

/** Checkbox row shared by the dashboard and the Tâches page. */
export function TaskRow({ task, meta, onToggle }: { task: Task; meta: string; onToggle: () => void }) {
  return (
    <label className="flex flex-1 cursor-pointer gap-3">
      <input type="checkbox" checked={task.done} onChange={onToggle} className="peer sr-only" />
      <span className="mt-[3px] grid size-4 shrink-0 place-items-center border border-glace/80 transition peer-checked:border-cyan/80 peer-checked:bg-cyan/20 peer-focus-visible:outline-2 peer-focus-visible:outline-cyan">
        {task.done && <img src={check} alt="" className="size-3" />}
      </span>
      <span>
        <span className={`block text-[11.5px] ${task.done ? 'text-ardoise' : 'text-ailes'}`}>{task.title}</span>
        <span className="mt-[5px] block text-[9.5px] text-ardoise">
          {task.doing && !task.done && <span className="text-cyan">▶ en cours · </span>}
          {meta}
        </span>
      </span>
    </label>
  )
}

export function TodayTasks() {
  const { state, today, update } = useStore()
  const items = sel.todayTasks(state, today).slice(0, 4)
  const open = items.filter((t) => !t.done).length
  return (
    <Panel title="TÂCHES DU JOUR" tag={`${open} / ${items.length}`} className="h-[280px]">
      {items.length === 0 && <Empty>Rien pour aujourd’hui ✦</Empty>}
      <ul className="mt-[19px] px-[15px]">
        {items.map((t, i) => (
          <li key={t.id} className={`flex pb-[11px] ${i > 0 ? 'border-t border-glace/10 pt-[11px]' : ''}`}>
            <TaskRow task={t} meta={taskMeta(sel.cosplayName(state, t.cosplayId), t)} onToggle={() => update('tasks', t.id, { done: !t.done })} />
          </li>
        ))}
      </ul>
    </Panel>
  )
}

export function BudgetByCategory() {
  const { state, today } = useStore()
  const categories = sel.budgetSummary(state, today).byCategory.slice(0, 4)
  return (
    <Panel title="BUDGET PAR CATÉGORIE" tag="[%]" className="h-[280px]">
      <ul className="mt-6 flex flex-col gap-[25px] px-[15px]">
        {categories.map(({ name, percent }) => (
          <li key={name}>
            <div className="flex justify-between">
              <span className="text-[11.5px] text-ailes">{name}</span>
              <span className={`text-[11px] font-medium ${percent > 100 ? 'text-glitch' : 'text-cyan'}`}>{percent} %</span>
            </div>
            <div className="mt-[9px]">
              <ProgressBar value={percent} height={5} label={`Budget ${name}`} />
            </div>
          </li>
        ))}
      </ul>
    </Panel>
  )
}

/** Bar chart of minutes per day of the current week. */
export function WeekChart() {
  const { state, today } = useStore()
  const { days } = sel.weekTime(state, today)
  const max = Math.max(1, ...days.map((d) => d.minutes))
  return (
    <ol className="flex items-end justify-between" aria-label="Temps par jour">
      {days.map((d) => {
        const top = d.minutes === max
        return (
          <li key={d.day} className="flex w-7 flex-col items-center gap-1" title={`${d.day} · ${hours(d.minutes)}`}>
            <span
              className={`w-7 bg-linear-to-b from-ailes to-halo transition-[height] duration-500 ${top ? 'shadow-[0_0_10px_rgb(92_242_228/0.5)]' : ''}`}
              style={{ height: (d.minutes / max) * 124.8 }}
            />
            <span className={`text-[9.5px] ${top || d.isToday ? 'text-cyan' : 'text-ardoise'} ${d.isToday ? 'underline underline-offset-2' : ''}`}>
              {d.label}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function WeekTime({ className = 'h-[280px]' }: { className?: string }) {
  const { state, today } = useStore()
  const { total, delta } = sel.weekTime(state, today)
  return (
    <Panel title="TEMPS CETTE SEMAINE" tag="[7 J]" className={className}>
      <div className="px-[15px]">
        <p className="mt-[10px] font-serif text-[36px] leading-[44px] font-medium italic text-chrome">{hours(total)}</p>
        <p className="text-[10px] text-cyan">
          {delta >= 0 ? '+' : '−'} {hours(Math.abs(delta))} vs semaine dernière
        </p>
      </div>
      <div className="mt-auto mb-[10px] px-[23px]">
        <WeekChart />
      </div>
    </Panel>
  )
}
