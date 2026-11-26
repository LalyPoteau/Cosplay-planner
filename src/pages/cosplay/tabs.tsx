import { useState, type FormEvent, type ReactNode } from 'react'
import { Button, Chip, Empty, Field, IconButton, Panel, ProgressBar } from '../../components/ui'
import { euros, hours, iso, shortDate } from '../../data/model'
import * as sel from '../../data/selectors'
import { useStore } from '../../data/useStore'
import Board, { QuickTask } from '../taches/Board'

/** Select one of the cosplay's pieces (or none). */
function PieceSelect({ cosplayId, value, onChange }: { cosplayId: string; value: string | null; onChange: (id: string | null) => void }) {
  const { state } = useStore()
  return (
    <select className="field" value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">— Toute la tenue —</option>
      {sel.piecesOf(state, cosplayId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
    </select>
  )
}

function TwoColumns({ main, side }: { main: ReactNode; side: ReactNode }) {
  return <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">{main}<div className="flex flex-col gap-4">{side}</div></div>
}

export function BudgetTab({ cosplayId }: { cosplayId: string }) {
  const { state, today, add, update, remove } = useStore()
  const cosplay = state.cosplays.find((c) => c.id === cosplayId)!
  const expenses = state.expenses.filter((e) => e.cosplayId === cosplayId).sort((a, b) => b.date.localeCompare(a.date))
  const spent = sel.cosplaySpent(state, cosplayId)
  const blank = { label: '', amount: '', category: state.categories[0]?.name ?? '', pieceId: null as string | null, date: iso(today), paid: true }
  const [form, setForm] = useState(blank)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const amount = Number(form.amount.replace(',', '.'))
    if (!form.label.trim() || !(amount > 0)) return
    add('expenses', { ...form, label: form.label.trim(), amount, cosplayId })
    setForm({ ...blank, category: form.category, pieceId: form.pieceId })
  }

  return (
    <TwoColumns
      main={
        <Panel title="DÉPENSES DU COSPLAY" tag={`[${expenses.length}]`}>
          {expenses.length === 0 && <Empty>Aucune dépense pour ce cosplay.</Empty>}
          <ul className="p-2">
            {expenses.map((e) => (
              <li key={e.id} className="flex items-center gap-3 border-b border-glace/10 px-2 py-2 last:border-0">
                <span className="w-14 text-[10px] text-ardoise">{shortDate(e.date)}</span>
                <span className="flex-1 text-[11.5px]">
                  {e.label}
                  <span className="ml-2 text-[9.5px] text-ardoise">{e.category} · {sel.pieceName(state, e.pieceId)}</span>
                </span>
                <button type="button" onClick={() => update('expenses', e.id, { paid: !e.paid })} className="cursor-pointer" title="Basculer payé / engagé">
                  <Chip tone={e.paid ? 'cyan' : 'glace'}>{e.paid ? 'PAYÉ' : 'ENGAGÉ'}</Chip>
                </button>
                <span className="w-16 text-right text-[11.5px] font-medium">{euros(e.amount)}</span>
                <IconButton label={`Supprimer ${e.label}`} onClick={() => remove('expenses', e.id)}>✕</IconButton>
              </li>
            ))}
          </ul>
        </Panel>
      }
      side={
        <>
          <Panel title="BUDGET DU COSPLAY">
            <div className="flex flex-col gap-3 p-4">
              <Field label="Budget prévu (€)">
                <input type="number" min={0} className="field" value={cosplay.budget || ''} placeholder="Non défini" onChange={(e) => update('cosplays', cosplayId, { budget: Math.max(0, Number(e.target.value)) })} />
              </Field>
              <p className="font-serif text-[28px] font-medium italic text-chrome">
                {euros(spent)} {cosplay.budget > 0 && <span className="text-[16px] text-argent">/ {euros(cosplay.budget)}</span>}
              </p>
              {cosplay.budget > 0 && (
                <>
                  <ProgressBar value={(spent / cosplay.budget) * 100} label="Budget utilisé" />
                  <p className={`text-[10.5px] ${spent > cosplay.budget ? 'text-glitch' : 'text-argent'}`}>
                    {spent > cosplay.budget ? `Dépassement de ${euros(spent - cosplay.budget)}` : `Reste ${euros(cosplay.budget - spent)}`}
                  </p>
                </>
              )}
            </div>
          </Panel>
          <Panel title="NOUVELLE DÉPENSE">
            <form onSubmit={submit} className="flex flex-col gap-3 p-4">
              <Field label="Libellé"><input required className="field" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex. Mercerie · satin" /></Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Montant (€)"><input required inputMode="decimal" className="field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></Field>
                <Field label="Date"><input type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
              </div>
              <Field label="Catégorie">
                <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                  {state.categories.map((c) => <option key={c.name}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Pièce"><PieceSelect cosplayId={cosplayId} value={form.pieceId} onChange={(pieceId) => setForm({ ...form, pieceId })} /></Field>
              <label className="flex items-center gap-2 text-[11px] text-argent">
                <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="accent-cyan" /> Déjà payé
              </label>
              <Button type="submit" variant="primary">AJOUTER</Button>
            </form>
          </Panel>
        </>
      }
    />
  )
}

export function TimeTab({ cosplayId }: { cosplayId: string }) {
  const { state, today, add, remove, startTimer, stopTimer } = useStore()
  const entries = state.time.filter((t) => t.cosplayId === cosplayId).sort((a, b) => b.date.localeCompare(a.date))
  const [form, setForm] = useState({ pieceId: null as string | null, date: iso(today), h: '', m: '', note: '' })
  const running = state.timer?.cosplayId === cosplayId
  const pieces = sel.piecesOf(state, cosplayId)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const minutes = Number(form.h || 0) * 60 + Number(form.m || 0)
    if (!(minutes > 0)) return
    add('time', { cosplayId, pieceId: form.pieceId, date: form.date, minutes, note: form.note.trim() })
    setForm({ ...form, h: '', m: '', note: '' })
  }

  return (
    <TwoColumns
      main={
        <Panel title="TEMPS ENREGISTRÉ" tag={hours(sel.cosplayMinutes(state, cosplayId))}>
          {pieces.length > 0 && (
            <ul className="flex flex-wrap gap-2 px-4 pt-3">
              {pieces.map((p) => (
                <li key={p.id} className="border border-glace/25 bg-glace/5 px-2 py-1 text-[10px] text-argent">
                  {p.name} · <span className="text-cyan">{hours(sel.pieceMinutes(state, p.id))}</span>
                </li>
              ))}
            </ul>
          )}
          {entries.length === 0 && <Empty>Pas encore de temps enregistré.</Empty>}
          <ul className="p-2">
            {entries.map((t) => (
              <li key={t.id} className="flex items-center gap-3 border-b border-glace/10 px-2 py-2 last:border-0">
                <span className="w-14 text-[10px] text-ardoise">{shortDate(t.date)}</span>
                <span className="flex-1 text-[11.5px]">
                  {sel.pieceName(state, t.pieceId) === '—' ? 'Toute la tenue' : sel.pieceName(state, t.pieceId)}
                  {t.note && <span className="ml-2 text-[9.5px] text-ardoise">{t.note}</span>}
                </span>
                <span className="text-[11.5px] font-medium text-cyan">{hours(t.minutes)}</span>
                <IconButton label="Supprimer l’entrée" onClick={() => remove('time', t.id)}>✕</IconButton>
              </li>
            ))}
          </ul>
        </Panel>
      }
      side={
        <Panel title="AJOUTER DU TEMPS">
          <form onSubmit={submit} className="flex flex-col gap-3 p-4">
            <Field label="Pièce"><PieceSelect cosplayId={cosplayId} value={form.pieceId} onChange={(pieceId) => setForm({ ...form, pieceId })} /></Field>
            <Button variant="primary" onClick={() => (running ? stopTimer() : startTimer(cosplayId, form.pieceId))}>
              {running ? '■ STOP & ENREGISTRER' : '▶ CHRONO SUR CETTE PIÈCE'}
            </Button>
            <p className="text-center text-[9.5px] text-ardoise">— ou à la main —</p>
            <Field label="Date"><input type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Heures"><input type="number" min={0} className="field" value={form.h} onChange={(e) => setForm({ ...form, h: e.target.value })} /></Field>
              <Field label="Minutes"><input type="number" min={0} max={59} className="field" value={form.m} onChange={(e) => setForm({ ...form, m: e.target.value })} /></Field>
            </div>
            <Field label="Note"><input className="field" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} /></Field>
            <Button type="submit">AJOUTER</Button>
          </form>
        </Panel>
      }
    />
  )
}

export function TasksTab({ cosplayId }: { cosplayId: string }) {
  return (
    <div className="flex flex-col gap-4">
      <QuickTask cosplayId={cosplayId} />
      <Board cosplayIds={[cosplayId]} showCosplay={false} />
    </div>
  )
}
