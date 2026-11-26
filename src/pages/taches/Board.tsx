import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import { Button, Empty, IconButton, Panel, ProgressBar } from '../../components/ui'
import { TaskRow } from '../../dashboard/panels'
import { daysUntil, shortDate } from '../../data/model'
import * as sel from '../../data/selectors'
import { useStore, type Store } from '../../data/useStore'
import { openCosplay } from '../../router'
import { useSeriesColor } from '../../useSeriesColor'

const COLUMN_STYLE: Record<sel.Column, string> = {
  prevu: 'text-glace',
  encours: 'text-cyan',
  fini: 'text-halo',
}

/** Moves a card to a column by adjusting its sub-tasks. */
function moveCard(store: Store, card: sel.BoardCard, to: sel.Column) {
  const { update } = store
  if (card.column === to) return
  if (!card.tasks.length) {
    if (card.pieceId) update('pieces', card.pieceId, { progress: to === 'fini' ? 100 : to === 'prevu' ? 0 : 50 })
    return
  }
  const byDue = [...card.tasks].sort((a, b) => (a.due ?? '9999').localeCompare(b.due ?? '9999'))
  if (to === 'fini') card.tasks.forEach((t) => update('tasks', t.id, { done: true, doing: false }))
  if (to === 'prevu') {
    if (card.tasks.some((t) => t.done) && !confirm('Remettre toutes les sous-tâches à faire ?')) return
    card.tasks.forEach((t) => update('tasks', t.id, { done: false, doing: false }))
  }
  if (to === 'encours') {
    const target = card.column === 'fini' ? byDue.filter((t) => t.done).at(-1) : byDue.find((t) => !t.done)
    if (target) update('tasks', target.id, { done: false, doing: true })
  }
}

type BoardProps = { cosplayIds: string[]; showCosplay?: boolean; hideDone?: boolean }

export default function Board({ cosplayIds, showCosplay = true, hideDone = false }: BoardProps) {
  const store = useStore()
  const cards = sel.boardCards(store.state, cosplayIds)
  const [openKey, setOpenKey] = useState<string | null>(null)
  const [over, setOver] = useState<sel.Column | null>(null)
  const opened = cards.find((c) => c.key === openKey) ?? null

  const onDrop = (e: DragEvent, column: sel.Column) => {
    e.preventDefault()
    setOver(null)
    const card = cards.find((c) => c.key === e.dataTransfer.getData('text/card'))
    if (card) moveCard(store, card, column)
  }

  return (
    <>
      <div className="grid items-start gap-4 lg:grid-cols-3">
        {sel.COLUMNS.map((col) => {
          const list = cards
            .filter((c) => c.column === col.id)
            .sort((a, b) => (a.nextDue ?? '9999').localeCompare(b.nextDue ?? '9999') || b.progress - a.progress)
          const collapsed = hideDone && col.id === 'fini'
          return (
            <section
              key={col.id}
              aria-label={col.label}
              onDragOver={(e) => (e.preventDefault(), setOver(col.id))}
              onDragLeave={() => setOver(null)}
              onDrop={(e) => onDrop(e, col.id)}
              className={`relative flex max-h-[calc(100dvh-260px)] min-h-[300px] flex-col border bg-panel transition ${over === col.id ? 'border-cyan/70 bg-cyan/5' : 'border-glace/26'}`}
            >
              <header className="flex items-center justify-between border-b border-glace/12 px-4 py-3">
                <h3 className={`font-serif text-[22px] font-medium italic ${COLUMN_STYLE[col.id]}`}>{col.label}</h3>
                <span className="text-[10px] tracking-[0.8px] text-ardoise">{String(list.length).padStart(2, '0')} CARTES</span>
              </header>
              {collapsed ? (
                <p className="px-4 py-6 text-center text-[10.5px] text-ardoise">{list.length} cartes finies masquées ✦</p>
              ) : (
                <ul className="scroll-thin flex min-h-0 flex-1 flex-col gap-3 p-3">
                  {list.length === 0 && <li className="py-6 text-center text-[10.5px] text-ardoise">Glisse une carte ici</li>}
                  {list.map((card) => (
                    <li key={card.key}>
                      <Card card={card} showCosplay={showCosplay} onOpen={() => setOpenKey(card.key)} />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )
        })}
      </div>
      {opened && <CardDialog card={opened} onClose={() => setOpenKey(null)} />}
    </>
  )
}

function Card({ card, showCosplay, onOpen }: { card: sel.BoardCard; showCosplay: boolean; onOpen: () => void }) {
  const { state, today } = useStore()
  const color = useSeriesColor()(card.cosplayId)
  const done = card.tasks.filter((t) => t.done).length
  const doing = card.tasks.find((t) => t.doing && !t.done)
  const due = card.nextDue ? daysUntil(card.nextDue, today) : null

  return (
    <button
      type="button"
      draggable
      onDragStart={(e) => e.dataTransfer.setData('text/card', card.key)}
      onClick={onOpen}
      className="group relative block w-full cursor-grab border border-glace/20 bg-glace/5 p-3 text-left transition hover:border-cyan/60 hover:bg-glace/10 active:cursor-grabbing"
    >
      <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} />
      {showCosplay && (
        <span className="mb-1 block truncate text-[9px] font-medium tracking-[1.1px] uppercase" style={{ color }}>
          {sel.cosplayName(state, card.cosplayId)}
        </span>
      )}
      <span className="flex items-baseline justify-between gap-2">
        <span className="truncate text-[13px] font-medium text-ailes">{card.title}</span>
        <span className="font-serif text-[22px] leading-none font-medium italic text-chrome">{card.progress}%</span>
      </span>
      <span className="mt-2 block"><ProgressBar value={card.progress} height={4} label={`Avancement ${card.title}`} /></span>
      <span className="mt-2 flex items-center justify-between gap-2 text-[9.5px] text-ardoise">
        <span>{card.tasks.length ? `${done}/${card.tasks.length} sous-tâches` : 'sans sous-tâche'}</span>
        {due !== null && <span className={due < 0 ? 'text-glitch' : due <= 3 ? 'text-rose' : ''}>{due < 0 ? `en retard ${-due} j` : due === 0 ? 'aujourd’hui' : `J-${due}`}</span>}
      </span>
      {doing && <span className="mt-1 block truncate text-[9.5px] text-cyan">▶ {doing.title}</span>}
    </button>
  )
}

function CardDialog({ card, onClose }: { card: sel.BoardCard; onClose: () => void }) {
  const { state, add, update, remove } = useStore()
  const dialog = useRef<HTMLDialogElement>(null)
  const [title, setTitle] = useState('')
  const [due, setDue] = useState('')
  const color = useSeriesColor()(card.cosplayId)
  const tasks = [...card.tasks].sort((a, b) => Number(a.done) - Number(b.done) || (a.due ?? '9999').localeCompare(b.due ?? '9999'))
  const done = card.tasks.filter((t) => t.done).length

  useEffect(() => {
    const d = dialog.current
    d?.showModal()
    return () => d?.close()
  }, [])

  const addTask = (e: FormEvent) => {
    e.preventDefault()
    if (!title.trim()) return
    add('tasks', { title: title.trim(), cosplayId: card.cosplayId, pieceId: card.pieceId, due: due || null, estimateMin: null, note: '', done: false, doing: false })
    setTitle('')
    setDue('')
  }

  return (
    <dialog
      ref={dialog}
      onCancel={(e) => (e.preventDefault(), onClose())}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[560px] max-w-[calc(100vw-32px)] overflow-visible bg-transparent p-0 text-ailes backdrop:bg-nuit/75 backdrop:backdrop-blur-[2px]"
    >
      <Panel title={card.title.toUpperCase()} tag={sel.cosplayName(state, card.cosplayId).toUpperCase()} className="animate-rise shadow-[0_0_32px_rgb(143_140_255/0.3)]">
        <span className="absolute inset-y-0 left-0 w-[3px]" style={{ background: color }} />
        <div className="flex flex-col gap-4 p-5">
          <div className="flex items-end justify-between gap-4">
            <div className="flex-1">
              <p className="label-hud">Avancement de la pièce</p>
              <div className="mt-2"><ProgressBar value={card.progress} label="Avancement" /></div>
              <p className="mt-1 text-[10px] text-ardoise">{card.tasks.length ? `${done} / ${card.tasks.length} sous-tâches faites` : 'progression manuelle'}</p>
            </div>
            <p className="font-serif text-[48px] leading-none font-medium italic text-chrome">{card.progress}%</p>
          </div>

          <ul className="scroll-thin flex max-h-[320px] flex-col border-y border-glace/12 py-2">
            {tasks.length === 0 && <Empty>Pas encore de sous-tâche.</Empty>}
            {tasks.map((t) => (
              <li key={t.id} className="group flex items-start gap-2 py-2">
                <TaskRow
                  task={t}
                  meta={[t.due && `échéance ${shortDate(t.due)}`, t.estimateMin && `${t.estimateMin} min`].filter(Boolean).join(' · ') || 'sans échéance'}
                  onToggle={() => update('tasks', t.id, { done: !t.done, doing: false })}
                />
                {!t.done && (
                  <button
                    type="button"
                    aria-pressed={t.doing}
                    onClick={() => update('tasks', t.id, { doing: !t.doing })}
                    className="h-6 shrink-0 cursor-pointer border border-glace/35 px-2 text-[9px] tracking-[0.6px] text-ardoise hover:text-cyan aria-pressed:border-cyan/70 aria-pressed:bg-cyan/15 aria-pressed:text-cyan"
                  >
                    {t.doing ? '▶ EN COURS' : 'DÉMARRER'}
                  </button>
                )}
                <span className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <IconButton label={`Supprimer ${t.title}`} onClick={() => remove('tasks', t.id)}>✕</IconButton>
                </span>
              </li>
            ))}
          </ul>

          <form onSubmit={addTask} className="grid grid-cols-[minmax(0,1fr)_130px_32px] gap-2">
            <input className="field h-8" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="+ Sous-tâche" aria-label="Nouvelle sous-tâche" />
            <input type="date" className="field h-8" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Échéance" />
            <button type="submit" aria-label="Ajouter" className="h-8 cursor-pointer border border-glace/40 text-cyan hover:bg-glace/10">↵</button>
          </form>

          <div className="grid grid-cols-2 gap-3">
            <Button onClick={onClose}>FERMER</Button>
            <Button variant="primary" onClick={() => openCosplay(card.cosplayId)}>OUVRIR LE PROJET →</Button>
          </div>
        </div>
      </Panel>
    </dialog>
  )
}

/** One-line task creation: title, character, piece, due date. */
export function QuickTask({ cosplayId: fixedCosplay }: { cosplayId?: string }) {
  const { state, add } = useStore()
  const [form, setForm] = useState({ title: '', cosplayId: fixedCosplay ?? '', pieceId: '', due: '' })
  const pieces = form.cosplayId ? sel.piecesOf(state, form.cosplayId) : []

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    add('tasks', {
      title: form.title.trim(),
      cosplayId: form.cosplayId || null,
      pieceId: form.pieceId || null,
      due: form.due || null,
      estimateMin: null,
      note: '',
      done: false,
      doing: false,
    })
    setForm({ ...form, title: '', due: '' })
  }

  return (
    <form onSubmit={submit} className="flex flex-wrap items-center gap-2 border border-glace/25 bg-glace/4 p-2">
      <input className="field h-9 min-w-56 flex-1" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="+ Nouvelle tâche…" aria-label="Nouvelle tâche" />
      {!fixedCosplay && (
        <select className="field h-9 w-44" value={form.cosplayId} onChange={(e) => setForm({ ...form, cosplayId: e.target.value, pieceId: '' })} aria-label="Personnage">
          <option value="">— Personnage —</option>
          {state.cosplays.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      )}
      <select className="field h-9 w-44" value={form.pieceId} onChange={(e) => setForm({ ...form, pieceId: e.target.value })} aria-label="Pièce" disabled={!pieces.length}>
        <option value="">Toute la tenue</option>
        {pieces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <input type="date" className="field h-9 w-36" value={form.due} onChange={(e) => setForm({ ...form, due: e.target.value })} aria-label="Échéance" />
      <Button type="submit" variant="primary" className="h-9">AJOUTER</Button>
    </form>
  )
}
