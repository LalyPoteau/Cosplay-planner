import { useState, type FormEvent } from 'react'
import wings from '../../assets/fx/wings-mannequin.svg'
import halo from '../../assets/fx/halo-mannequin.svg'
import silhouette from '../../assets/fx/silhouette.svg'
import point from '../../assets/fx/point.svg'
import pointActive from '../../assets/fx/point-active.svg'
import pointDot from '../../assets/fx/point-dot.svg'
import pointDotActive from '../../assets/fx/point-dot-active.svg'
import pointTarget from '../../assets/fx/point-target.svg'
import radioActive from '../../assets/fx/radio-active.svg'
import bobine from '../../assets/icons/bobine.svg'
import euro from '../../assets/icons/euro.svg'
import check from '../../assets/icons/check.svg'
import plusLight from '../../assets/icons/plus-light.svg'
import { Button, Chip, Empty, Field, IconButton, Panel, ProgressBar } from '../../components/ui'
import { TaskRow } from '../../dashboard/panels'
import { euros, hours, iso, uid, type Piece } from '../../data/model'
import { SPOT_GROUPS, SPOTS, spotById, type SpotId } from '../../data/spots'
import * as sel from '../../data/selectors'
import { useStore } from '../../data/useStore'
import { RefThumb } from './References'
import Suggest from '../../components/Suggest'

/** Spot picker grouped by body area. */
function SpotSelect({ value, onChange, className = 'field' }: { value: SpotId; onChange: (spot: SpotId) => void; className?: string }) {
  return (
    <select className={className} value={value} onChange={(e) => onChange(e.target.value as SpotId)} aria-label="Emplacement">
      {SPOT_GROUPS.map((g) => (
        <optgroup key={g} label={g}>
          {SPOTS.filter((s) => s.group === g).map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </optgroup>
      ))}
    </select>
  )
}

export default function Mannequin({ cosplayId, onOpenRefs }: { cosplayId: string; onOpenRefs: (pieceId: string) => void }) {
  const { state } = useStore()
  const pieces = sel.piecesOf(state, cosplayId)
  const [selectedId, setSelectedId] = useState<string | null>(
    () => pieces.find((p) => sel.pieceStatus(sel.pieceProgress(state, p.id)) === 'En cours')?.id ?? pieces[0]?.id ?? null,
  )
  // Spot chosen for a new piece (opens the add form), null = form closed
  const [newSpot, setNewSpot] = useState<SpotId | null>(null)
  const selected = pieces.find((p) => p.id === selectedId) ?? null

  return (
    <div className="grid gap-4 xl:grid-cols-[320px_520px_minmax(0,1fr)]">
      <PieceList cosplayId={cosplayId} pieces={pieces} selectedId={selected?.id ?? null} onSelect={setSelectedId} newSpot={newSpot} setNewSpot={setNewSpot} />
      <MannequinView pieces={pieces} selectedId={selected?.id ?? null} onSelect={setSelectedId} onAddAt={setNewSpot} />
      {selected ? (
        <PieceDetail key={selected.id} piece={selected} onDeleted={() => setSelectedId(null)} onOpenRefs={onOpenRefs} />
      ) : (
        <Panel title="DÉTAIL" className="h-[632px]">
          <Empty>Clique un emplacement en pointillé sur le mannequin pour y ajouter une pièce.</Empty>
        </Panel>
      )}
    </div>
  )
}

type ListProps = {
  cosplayId: string
  pieces: Piece[]
  selectedId: string | null
  onSelect: (id: string) => void
  newSpot: SpotId | null
  setNewSpot: (spot: SpotId | null) => void
}

function PieceList({ cosplayId, pieces, selectedId, onSelect, newSpot, setNewSpot }: ListProps) {
  const { state, add } = useStore()
  const [name, setName] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !newSpot) return
    onSelect(add('pieces', { cosplayId, name: name.trim(), spot: newSpot, progress: 0, materials: [], notes: '' }))
    setName('')
    setNewSpot(null)
  }

  return (
    <Panel title="PIÈCES DU COSTUME" tag={String(pieces.length).padStart(2, '0')} className="h-[632px]">
      <ul className="scroll-thin mt-[22px] flex min-h-0 flex-1 flex-col gap-[10px] px-3 pb-1">
        {pieces.length === 0 && <Empty>Aucune pièce pour l’instant.</Empty>}
        {pieces.map((p) => {
          const progress = sel.pieceProgress(state, p.id)
          const status = sel.pieceStatus(progress)
          const stats = sel.pieceTaskStats(state, p.id)
          const active = p.id === selectedId
          return (
            <li key={p.id} className="shrink-0">
              <button
                type="button"
                aria-pressed={active}
                onClick={() => onSelect(p.id)}
                className={`relative block h-[76px] w-full cursor-pointer border pr-[14px] pl-[43px] text-left transition ${
                  active
                    ? 'border-cyan/70 bg-linear-to-r from-halo/30 to-cyan/6 drop-shadow-[0_0_6px_rgb(92_242_228/0.25)]'
                    : 'border-glace/16 bg-glace/4 hover:border-glace/40'
                }`}
              >
                <span className="absolute top-[15px] left-[13px]">
                  {status === 'Fini' ? (
                    <span className="grid size-[18px] place-items-center rounded-full border border-cyan/80 bg-cyan/20"><img src={check} alt="" className="size-3" /></span>
                  ) : active ? (
                    <img src={radioActive} alt="" className="-m-px size-5 max-w-none" />
                  ) : (
                    <span className="block size-[18px] rounded-full border border-glace/80" />
                  )}
                </span>
                <span className="flex justify-between pt-[13px]">
                  <span className="truncate text-[12.5px] font-medium text-ailes">{p.name}</span>
                  <span className="text-[10.5px] text-argent">{progress} %</span>
                </span>
                <span className="flex justify-between text-[9.5px]">
                  <span className={status === 'En cours' ? 'text-cyan' : 'text-ardoise'}>{status} · {spotById(p.spot).label}</span>
                  <span className="text-ardoise">{stats.total ? `${stats.done}/${stats.total} tâches` : 'manuel'}</span>
                </span>
                <span className="mt-[9px] block"><ProgressBar value={progress} height={4} label={`Avancement ${p.name}`} /></span>
              </button>
            </li>
          )
        })}
      </ul>

      <div className="border-t border-glace/10 p-3">
        {newSpot ? (
          <form onSubmit={submit} className="flex flex-col gap-2 border border-cyan/40 bg-cyan/5 p-3">
            <Field label="Nom de la pièce">
              <input autoFocus required className="field" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex. Nœud dorsal" />
            </Field>
            <Field label="Emplacement sur le mannequin">
              <SpotSelect value={newSpot} onChange={setNewSpot} />
            </Field>
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setNewSpot(null)}>ANNULER</Button>
              <Button type="submit" variant="primary">AJOUTER</Button>
            </div>
          </form>
        ) : (
          <Button icon={plusLight} className="w-full" onClick={() => setNewSpot('poitrine')}>AJOUTER UNE PIÈCE</Button>
        )}
      </div>
    </Panel>
  )
}

type ViewProps = { pieces: Piece[]; selectedId: string | null; onSelect: (id: string) => void; onAddAt: (spot: SpotId) => void }

function MannequinView({ pieces, selectedId, onSelect, onAddAt }: ViewProps) {
  const [showFree, setShowFree] = useState(true)
  // Several pieces can share a spot: their labels stack under each other.
  const stack = new Map<SpotId, number>()
  const marks = pieces.map((p) => {
    const spot = spotById(p.spot)
    const index = stack.get(p.spot) ?? 0
    stack.set(p.spot, index + 1)
    return { piece: p, ...spot, chipY: spot.cy - 11 + index * 26, active: p.id === selectedId }
  })
  const free = SPOTS.filter((s) => !stack.has(s.id))

  return (
    <Panel title="VUE MANNEQUIN" tag="CLIQUER UN POINT" className="h-[632px] overflow-hidden">
      <div className="relative mx-auto mt-[9px] h-[594px] w-[518px] max-w-full">
        <img src={wings} alt="" className="pointer-events-none absolute top-[10px] -left-5 h-[300px] w-[560px] max-w-none" />
        <img src={halo} alt="" className="pointer-events-none absolute top-[3.25px] left-[219.25px] h-[39.5px] w-[81.5px] max-w-none" />
        <img src={silhouette} alt="Silhouette du mannequin" className="pointer-events-none absolute top-[30px] left-[140px] h-[520px] w-[240px] max-w-none" />

        <svg className="pointer-events-none absolute inset-0" width={518} height={594} aria-hidden>
          {marks.map((m) => (
            <line
              key={m.piece.id}
              x1={m.x} y1={m.y}
              x2={m.side === 'left' ? 144 : 404} y2={m.chipY + 11}
              stroke={m.active ? '#5cf2e4' : '#a9c7ff'}
              strokeOpacity={m.active ? 0.9 : 0.45}
            />
          ))}
        </svg>

        {/* free spots: dashed placeholders, click to add a piece there */}
        {showFree &&
          free.map((s) => (
            <button
              key={s.id}
              type="button"
              aria-label={`Ajouter une pièce · ${s.label}`}
              onClick={() => onAddAt(s.id)}
              className="group absolute size-[14px] cursor-pointer"
              style={{ left: s.x - 7, top: s.y - 7 }}
            >
              <span className="absolute inset-0 rounded-full border border-dashed border-glace/45 transition group-hover:scale-125 group-hover:border-cyan group-focus-visible:border-cyan" />
              <span className="absolute inset-[5px] rounded-full bg-glace/30 group-hover:bg-cyan" />
              <span
                className={`pointer-events-none absolute top-1/2 z-10 -translate-y-1/2 border border-dashed border-cyan/60 bg-nuit/90 px-2 py-[3px] text-[9px] tracking-[0.7px] whitespace-nowrap text-cyan uppercase opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100 ${
                  s.side === 'left' ? 'right-5' : 'left-5'
                }`}
              >
                + Ajouter · {s.label}
              </span>
            </button>
          ))}

        {marks.map((m) => (
          <button
            key={m.piece.id}
            type="button"
            aria-hidden
            tabIndex={-1}
            onClick={() => onSelect(m.piece.id)}
            className="group absolute size-[14px] cursor-pointer"
            style={{ left: m.x - 7, top: m.y - 7 }}
          >
            {m.active && <img src={pointTarget} alt="" className="absolute -top-[7.5px] -left-[7.5px] size-[29px] max-w-none animate-twinkle" />}
            <img src={m.active ? pointActive : point} alt="" className="absolute -top-[8.7px] -left-[8.7px] size-[31.4px] max-w-none transition group-hover:scale-125" />
            <img src={m.active ? pointDotActive : pointDot} alt="" className="absolute top-[4.5px] left-[4.5px] size-[5px]" />
          </button>
        ))}

        {marks.map((m) => (
          <button
            key={m.piece.id}
            type="button"
            onClick={() => onSelect(m.piece.id)}
            className={`absolute h-[22px] cursor-pointer border px-2 text-[9.5px] font-medium tracking-[0.76px] whitespace-nowrap uppercase transition ${
              m.active ? 'border-transparent bg-cyan/95 text-nuit' : 'border-glace/55 bg-glace/12 text-glace hover:bg-glace/25'
            }`}
            style={m.side === 'left' ? { left: 24, top: m.chipY } : { left: 404, top: m.chipY }}
          >
            {m.piece.name}
          </button>
        ))}

        <div className="absolute inset-x-0 top-[566px] flex items-center justify-center gap-4 text-[9.5px] tracking-[0.38px] text-ardoise">
          <span>Point plein = pièce · pointillé = emplacement libre</span>
          <label className="flex cursor-pointer items-center gap-1 text-glace">
            <input type="checkbox" checked={showFree} onChange={(e) => setShowFree(e.target.checked)} className="accent-cyan" />
            libres ({free.length})
          </label>
        </div>
      </div>
    </Panel>
  )
}

function PieceDetail({ piece, onDeleted, onOpenRefs }: { piece: Piece; onDeleted: () => void; onOpenRefs: (pieceId: string) => void }) {
  const { state, add, update, remove } = useStore()
  const [material, setMaterial] = useState({ name: '', qty: '' })
  const [expense, setExpense] = useState({ label: '', amount: '', category: state.categories[0]?.name ?? '' })
  const [newTask, setNewTask] = useState('')
  const progress = sel.pieceProgress(state, piece.id)
  const status = sel.pieceStatus(progress)
  const tasks = state.tasks.filter((t) => t.pieceId === piece.id).sort((a, b) => Number(a.done) - Number(b.done))
  const expenses = state.expenses.filter((e) => e.pieceId === piece.id)
  const refs = state.refs.filter((r) => r.pieceId === piece.id)

  const addMaterial = (e: FormEvent) => {
    e.preventDefault()
    if (!material.name.trim()) return
    update('pieces', piece.id, { materials: [...piece.materials, { id: uid(), name: material.name.trim(), qty: material.qty.trim() }] })
    setMaterial({ name: '', qty: '' })
  }
  const addExpense = (e: FormEvent) => {
    e.preventDefault()
    const amount = Number(expense.amount.replace(',', '.'))
    if (!expense.label.trim() || !(amount > 0)) return
    add('expenses', { label: expense.label.trim(), amount, category: expense.category, cosplayId: piece.cosplayId, pieceId: piece.id, date: iso(new Date()), paid: true })
    setExpense({ ...expense, label: '', amount: '' })
  }
  const addTask = (e: FormEvent) => {
    e.preventDefault()
    if (!newTask.trim()) return
    add('tasks', { title: newTask.trim(), cosplayId: piece.cosplayId, pieceId: piece.id, due: null, estimateMin: null, note: '', done: false, doing: false })
    setNewTask('')
  }
  const deletePiece = () => {
    if (!confirm(`Supprimer la pièce « ${piece.name} » ? Ses tâches, dépenses et références sont gardées.`)) return
    state.tasks.filter((t) => t.pieceId === piece.id).forEach((t) => update('tasks', t.id, { pieceId: null }))
    state.expenses.filter((x) => x.pieceId === piece.id).forEach((x) => update('expenses', x.id, { pieceId: null }))
    state.time.filter((x) => x.pieceId === piece.id).forEach((x) => update('time', x.id, { pieceId: null }))
    refs.forEach((r) => update('refs', r.id, { pieceId: null }))
    remove('pieces', piece.id)
    onDeleted()
  }

  const section = 'text-[9.5px] font-medium tracking-[1.33px] text-cyan'

  return (
    <Panel title={`DÉTAIL  ·  ${piece.name.toUpperCase()}`} tag={status.toUpperCase()} className="h-[632px] drop-shadow-[0_0_12px_rgb(143_140_255/0.18)]">
      <div className="scroll-thin flex min-h-0 flex-1 flex-col px-5 pt-[22px] pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-glace/15 pb-[14px]">
          <div className="flex items-center gap-2">
            <Chip tone={status === 'Prévu' ? 'glace' : 'cyan'}>{status.toUpperCase()}</Chip>
            <SpotSelect className="field h-[22px] px-1 text-[9.5px]" value={piece.spot} onChange={(spot) => update('pieces', piece.id, { spot })} />
          </div>
          <span className="text-[11px] text-argent">Temps passé <span className="ml-1 text-ailes">{hours(sel.pieceMinutes(state, piece.id))}</span></span>
        </div>

        {tasks.length === 0 && (
          <label className="mt-3 flex items-center gap-2 text-[9.5px] text-ardoise">
            PROGRESSION MANUELLE
            <input type="range" min={0} max={100} value={piece.progress} onChange={(e) => update('pieces', piece.id, { progress: Number(e.target.value) })} className="flex-1 accent-cyan" />
            <span className="text-cyan">{piece.progress} %</span>
          </label>
        )}

        <p className={`mt-4 ${section}`}>MATÉRIAUX</p>
        <ul className="mt-2">
          {piece.materials.map((m) => {
            const stock = sel.stockFor(state, m.name)
            return (
              <li key={m.id} className="group flex items-center gap-[10px] py-[6px]">
                <img src={bobine} alt="" className="size-[18px]" />
                <span className="min-w-0 flex-1 truncate text-[11.5px]">{m.name}</span>
                <span className="text-[11px] text-argent">{m.qty}</span>
                {stock && !sel.isLow(stock) ? (
                  <span title="Dans ton stock" className="border border-cyan/40 px-[6px] py-[2px] text-[8.5px] tracking-[0.6px] text-cyan">
                    STOCK · {stock.qty.toLocaleString('fr-FR')} {stock.unit}
                  </span>
                ) : (
                  <button
                    type="button"
                    title="Préparer une dépense pour l’acheter"
                    onClick={() => setExpense({ ...expense, label: m.name })}
                    className="cursor-pointer border border-rose/40 px-[6px] py-[2px] text-[8.5px] tracking-[0.6px] text-rose hover:bg-rose/10"
                  >
                    À ACHETER
                  </button>
                )}
                <span className="w-7 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                  <IconButton label={`Retirer ${m.name}`} onClick={() => update('pieces', piece.id, { materials: piece.materials.filter((x) => x.id !== m.id) })}>✕</IconButton>
                </span>
              </li>
            )
          })}
        </ul>
        <form onSubmit={addMaterial} className="mt-1 grid grid-cols-[minmax(0,1fr)_84px_32px] gap-2">
          <Suggest
            className="field h-8"
            value={material.name}
            onChange={(name) => setMaterial({ ...material, name })}
            suggestions={state.stock.map((i) => ({ label: i.name, hint: `${i.qty.toLocaleString('fr-FR')} ${i.unit} en stock` }))}
            placeholder="+ Matériau (tape pour chercher dans le stock)"
            ariaLabel="Nouveau matériau"
          />
          <input className="field h-8" value={material.qty} onChange={(e) => setMaterial({ ...material, qty: e.target.value })} placeholder="0,5 m" aria-label="Quantité" />
          <button type="submit" aria-label="Ajouter le matériau" className="h-8 cursor-pointer border border-glace/40 text-cyan hover:bg-glace/10">↵</button>
        </form>

        <p className={`mt-4 ${section}`}>DÉPENSES LIÉES</p>
        <ul className="mt-2">
          {expenses.map((x) => (
            <li key={x.id} className="group flex items-center gap-[10px] py-[6px]">
              <img src={euro} alt="" className="size-[18px]" />
              <span className="min-w-0 flex-1 truncate text-[11.5px]">{x.label}</span>
              <button
                type="button"
                title="Basculer payé / engagé"
                onClick={() => update('expenses', x.id, { paid: !x.paid })}
                className={`cursor-pointer border px-[10px] py-[3px] text-[8.5px] font-medium tracking-[0.68px] ${x.paid ? 'border-cyan/55 bg-cyan/12 text-cyan' : 'border-glace/55 bg-glace/12 text-glace'}`}
              >
                {x.paid ? 'PAYÉ' : 'ENGAGÉ'} · {euros(x.amount)}
              </button>
              <span className="w-7 opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <IconButton label={`Supprimer ${x.label}`} onClick={() => remove('expenses', x.id)}>✕</IconButton>
              </span>
            </li>
          ))}
        </ul>
        <form onSubmit={addExpense} className="mt-1 grid grid-cols-[minmax(0,1fr)_64px_96px_32px] gap-2">
          <input className="field h-8" value={expense.label} onChange={(e) => setExpense({ ...expense, label: e.target.value })} placeholder="+ Dépense" aria-label="Nouvelle dépense" />
          <input inputMode="decimal" className="field h-8" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} placeholder="€" aria-label="Montant" />
          <select className="field h-8 px-1 text-[10px]" value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })} aria-label="Catégorie">
            {state.categories.map((c) => <option key={c.name}>{c.name}</option>)}
          </select>
          <button type="submit" aria-label="Ajouter la dépense" className="h-8 cursor-pointer border border-glace/40 text-cyan hover:bg-glace/10">↵</button>
        </form>

        <p className={`mt-4 ${section}`}>TÂCHES À SUIVRE</p>
        <ul className="mt-2 flex flex-col gap-2">
          {tasks.map((t) => (
            <li key={t.id} className="flex">
              <TaskRow task={t} meta={t.due ? `échéance ${t.due.slice(8, 10)}/${t.due.slice(5, 7)}` : 'sans échéance'} onToggle={() => update('tasks', t.id, { done: !t.done })} />
            </li>
          ))}
        </ul>
        <form onSubmit={addTask} className="mt-2 grid grid-cols-[minmax(0,1fr)_32px] gap-2">
          <input className="field h-8" value={newTask} onChange={(e) => setNewTask(e.target.value)} placeholder="+ Nouvelle tâche pour cette pièce" aria-label="Nouvelle tâche" />
          <button type="submit" aria-label="Ajouter la tâche" className="h-8 cursor-pointer border border-glace/40 text-cyan hover:bg-glace/10">↵</button>
        </form>

        <p className={`mt-4 ${section}`}>NOTES &amp; RÉFÉRENCES</p>
        <div className="mt-2 flex gap-3 border border-glace/20 bg-nuit/40 p-3">
          <textarea
            aria-label="Notes"
            value={piece.notes}
            onChange={(e) => update('pieces', piece.id, { notes: e.target.value })}
            placeholder="Mesures, astuces, liens de tutos…"
            className="min-h-[96px] flex-1 resize-y bg-transparent text-[11px] leading-[1.5] text-argent placeholder:text-ardoise"
          />
          <button
            type="button"
            onClick={() => onOpenRefs(piece.id)}
            aria-label={`Voir les références de ${piece.name}`}
            className="shrink-0 cursor-pointer transition hover:brightness-125 focus-visible:outline-1 focus-visible:outline-cyan"
          >
            <RefThumb image={refs.find((r) => r.image)?.image ?? null} label={`${refs.length} RÉF.`} className="h-[96px] w-[112px]" />
          </button>
        </div>

      </div>
      <div className="flex items-center justify-between border-t border-glace/10 px-5 py-3">
        <p className="text-[9.5px] text-ardoise">Entrée ↵ pour ajouter · tout se range dans cette pièce</p>
        <Button onClick={deletePiece} className="h-8 hover:border-glitch/60 hover:text-glitch">SUPPRIMER LA PIÈCE</Button>
      </div>
    </Panel>
  )
}
