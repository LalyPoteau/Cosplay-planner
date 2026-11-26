import { useState, type FormEvent, type ReactNode } from 'react'
import play from '../assets/icons/play.svg'
import { Button, Empty, Field, IconButton, PageHeader, Panel } from '../components/ui'
import { WeekTime } from '../dashboard/panels'
import { hours, iso, shortDate } from '../data/model'
import * as sel from '../data/selectors'
import { useStore } from '../data/useStore'
import { openCosplay } from '../router'
import { useNow } from '../useNow'
import { CosplaySelect } from './shared'

/** Fold-out to tie time to one piece of the chosen cosplay. */
function PieceFoldout({ cosplayId, value, onChange }: { cosplayId: string | null; value: string | null; onChange: (id: string | null) => void }) {
  const { state } = useStore()
  const pieces = cosplayId ? sel.piecesOf(state, cosplayId) : []
  const [open, setOpen] = useState(value !== null)
  if (!pieces.length) return null
  return (
    <div className="border border-glace/20 bg-glace/4">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-[10px] tracking-[0.8px] text-glace hover:text-cyan"
      >
        <span>{open ? '▾' : '▸'} RATTACHER À UNE PIÈCE</span>
        <span className="text-ardoise">{value ? sel.pieceName(state, value) : 'toute la tenue'}</span>
      </button>
      {open && (
        <div className="flex flex-wrap gap-[6px] px-3 pb-3">
          {[{ id: null as string | null, name: 'Toute la tenue' }, ...pieces].map((p) => (
            <button
              key={p.id ?? 'none'}
              type="button"
              aria-pressed={value === p.id}
              onClick={() => onChange(p.id)}
              className="h-6 cursor-pointer border border-glace/40 px-2 text-[9.5px] text-argent transition hover:border-cyan/60 aria-pressed:border-cyan/80 aria-pressed:bg-cyan/15 aria-pressed:text-cyan"
            >
              {p.name}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

export default function Temps() {
  const { state, today, add, update, remove, startTimer, stopTimer } = useStore()
  const [chrono, setChrono] = useState({ cosplayId: state.currentCosplayId, pieceId: null as string | null })
  const [form, setForm] = useState({ cosplayId: state.currentCosplayId, pieceId: null as string | null, date: iso(today), h: '', m: '', note: '' })
  const timer = state.timer
  const now = useNow(timer ? 1000 : null)

  const elapsed = timer ? Math.max(0, Math.floor((now - timer.startedAt) / 1000)) : 0
  const clock = [Math.floor(elapsed / 3600), Math.floor(elapsed / 60) % 60, elapsed % 60].map((n) => String(n).padStart(2, '0')).join(':')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const minutes = Number(form.h || 0) * 60 + Number(form.m || 0)
    if (!(minutes > 0)) return
    add('time', { cosplayId: form.cosplayId, pieceId: form.pieceId, date: form.date, minutes, note: form.note.trim() })
    setForm({ ...form, h: '', m: '', note: '' })
  }

  const entries = [...state.time].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 30)
  const byCosplay = state.cosplays
    .map((c) => ({ cosplay: c, minutes: sel.cosplayMinutes(state, c.id) }))
    .filter((x) => x.minutes > 0)
    .sort((a, b) => b.minutes - a.minutes)
  const maxCosplay = Math.max(1, ...byCosplay.map((x) => x.minutes))

  return (
    <>
      <PageHeader
        code="SUIVI DU TEMPS"
        title="Suivi du temps"
        subtitle={`${hours(sel.weekTime(state, today).total)} cette semaine · ${hours(sel.monthMinutes(state, today))} ce mois`}
      />

      <div className="grid gap-6 px-6 pt-6 xl:grid-cols-[minmax(0,1fr)_388px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Panel title="CHRONOMÈTRE" tag={timer ? '[REC ●]' : '[PRÊT]'}>
            <div className="flex flex-col gap-3 p-4">
              <div className="flex flex-wrap items-center gap-6">
                <p className={`font-serif text-[56px] leading-none font-medium italic tabular-nums ${timer ? 'text-chrome' : 'text-ardoise'}`}>{clock}</p>
                <div className="flex flex-1 flex-wrap items-end gap-3">
                  <Field label="Cosplay" className="min-w-48 flex-1">
                    <CosplaySelect value={timer ? timer.cosplayId : chrono.cosplayId} onChange={(id) => setChrono({ cosplayId: id, pieceId: null })} />
                  </Field>
                  {timer ? (
                    <Button variant="primary" onClick={stopTimer}>■ STOP & ENREGISTRER</Button>
                  ) : (
                    <Button variant="primary" icon={play} onClick={() => startTimer(chrono.cosplayId, chrono.pieceId)}>DÉMARRER</Button>
                  )}
                </div>
              </div>
              {timer ? (
                <p className="text-[10.5px] text-argent">
                  En cours sur <span className="text-cyan">{sel.cosplayName(state, timer.cosplayId)}</span>
                  {timer.pieceId && <> · <span className="text-cyan">{sel.pieceName(state, timer.pieceId)}</span></>}
                </p>
              ) : (
                <PieceFoldout key={chrono.cosplayId} cosplayId={chrono.cosplayId} value={chrono.pieceId} onChange={(pieceId) => setChrono({ ...chrono, pieceId })} />
              )}
            </div>
          </Panel>

          <Panel title="TEMPS PAR COSPLAY & PAR PIÈCE" tag="DÉPLIER POUR VOIR LES PIÈCES">
            {byCosplay.length === 0 && <Empty>Aucun temps enregistré.</Empty>}
            <ul className="p-2">
              {byCosplay.map(({ cosplay: c, minutes }) => {
                const pieces = sel.piecesOf(state, c.id)
                  .map((p) => ({ id: p.id, name: p.name, minutes: sel.pieceMinutes(state, p.id) }))
                const loose = minutes - pieces.reduce((s, p) => s + p.minutes, 0)
                const rows = [...pieces, { id: 'none', name: 'Toute la tenue (sans pièce)', minutes: loose }].filter((p) => p.minutes > 0).sort((a, b) => b.minutes - a.minutes)
                return (
                  <li key={c.id}>
                    <details className="group border-b border-glace/10 last:border-0">
                      <summary className="flex cursor-pointer list-none items-center gap-3 px-2 py-2 hover:bg-glace/5">
                        <span className="w-3 text-[10px] text-cyan transition group-open:rotate-90">▸</span>
                        <span className="w-40 truncate text-[11.5px]">{c.name}</span>
                        <Bar value={minutes / maxCosplay} />
                        <span className="w-16 text-right text-[11.5px] font-medium text-cyan">{hours(minutes)}</span>
                      </summary>
                      <ul className="pb-2 pl-8">
                        {rows.map((p) => (
                          <li key={p.id} className="flex items-center gap-3 py-1 pr-2">
                            <span className="w-40 truncate text-[10.5px] text-argent">{p.name}</span>
                            <Bar value={p.minutes / minutes} faint />
                            <span className="w-16 text-right text-[10.5px] text-glace">{hours(p.minutes)}</span>
                          </li>
                        ))}
                        <li className="pt-1">
                          <button type="button" onClick={() => openCosplay(c.id)} className="cursor-pointer text-[9.5px] tracking-[0.8px] text-cyan hover:underline">
                            OUVRIR LA FICHE →
                          </button>
                        </li>
                      </ul>
                    </details>
                  </li>
                )
              })}
            </ul>
          </Panel>

          <Panel title="ENTRÉES" tag={`[${state.time.length}]`}>
            {entries.length === 0 && <Empty>Aucun temps enregistré.</Empty>}
            <ul className="p-2">
              {entries.map((t) => {
                const pieces = t.cosplayId ? sel.piecesOf(state, t.cosplayId) : []
                return (
                  <li key={t.id} className="flex items-center gap-3 border-b border-glace/10 px-2 py-2 last:border-0">
                    <span className="w-14 text-[10px] text-ardoise">{shortDate(t.date)}</span>
                    <span className="min-w-0 flex-1 truncate text-[11.5px]">
                      {sel.cosplayName(state, t.cosplayId)}
                      {t.note && <span className="ml-2 text-[9.5px] text-ardoise">{t.note}</span>}
                    </span>
                    {pieces.length > 0 && (
                      <select
                        aria-label="Pièce"
                        className="field h-[24px] w-40 px-1 text-[9.5px]"
                        value={t.pieceId ?? ''}
                        onChange={(e) => update('time', t.id, { pieceId: e.target.value || null })}
                      >
                        <option value="">Toute la tenue</option>
                        {pieces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                    )}
                    <span className="w-14 text-right text-[11.5px] font-medium text-cyan">{hours(t.minutes)}</span>
                    <IconButton label="Supprimer l’entrée" onClick={() => remove('time', t.id)}>✕</IconButton>
                  </li>
                )
              })}
            </ul>
          </Panel>
        </div>

        <div className="flex flex-col gap-4">
          <WeekTime />
          <Panel title="AJOUTER DU TEMPS">
            <form onSubmit={submit} className="flex flex-col gap-3 p-4">
              <Field label="Cosplay">
                <CosplaySelect value={form.cosplayId} onChange={(id) => setForm({ ...form, cosplayId: id, pieceId: null })} />
              </Field>
              <PieceFoldout key={form.cosplayId} cosplayId={form.cosplayId} value={form.pieceId} onChange={(pieceId) => setForm({ ...form, pieceId })} />
              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" className="col-span-2">
                  <input type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
                </Field>
                <Field label="Heures">
                  <input type="number" min={0} className="field" value={form.h} onChange={(e) => setForm({ ...form, h: e.target.value })} />
                </Field>
                <Field label="Minutes">
                  <input type="number" min={0} max={59} className="field" value={form.m} onChange={(e) => setForm({ ...form, m: e.target.value })} />
                </Field>
              </div>
              <Field label="Note">
                <input className="field" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Ex. couture du col" />
              </Field>
              <Button type="submit" variant="primary">AJOUTER</Button>
            </form>
          </Panel>
        </div>
      </div>
    </>
  )
}

function Bar({ value, faint = false }: { value: number; faint?: boolean }): ReactNode {
  return (
    <span className="h-[5px] flex-1 rounded-full bg-ailes/9">
      <span className={`block h-full rounded-full ${faint ? 'bg-glace/60' : 'bg-bar'}`} style={{ width: `${Math.min(100, value * 100)}%` }} />
    </span>
  )
}
