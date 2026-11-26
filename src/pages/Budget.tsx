import { useState, type FormEvent } from 'react'
import { Button, Chip, Empty, Field, HudCorners, IconButton, PageHeader, Panel, ProgressBar } from '../components/ui'
import { euros, iso, shortDate } from '../data/model'
import * as sel from '../data/selectors'
import { useStore } from '../data/useStore'
import { CosplaySelect } from './shared'

export default function Budget() {
  const { state, today, add, update, remove } = useStore()
  const b = sel.budgetSummary(state, today)
  const blank = { label: '', amount: '', category: state.categories[0]?.name ?? '', cosplayId: state.currentCosplayId, date: iso(today), paid: true }
  const [form, setForm] = useState(blank)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    const amount = Number(form.amount.replace(',', '.'))
    if (!form.label.trim() || !(amount > 0)) return
    add('expenses', { ...form, label: form.label.trim(), amount, pieceId: null })
    setForm({ ...blank, category: form.category, cosplayId: form.cosplayId })
  }

  const expenses = [...state.expenses].sort((x, y) => y.date.localeCompare(x.date))

  return (
    <>
      <PageHeader code="BUDGET" title="Budget" subtitle="Dépenses du mois, calculées automatiquement" />

      <div className="grid gap-6 px-6 pt-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex flex-col gap-4">
          <TargetHero />

          <Panel title="PAR CATÉGORIE" tag="[%]">
            <ul className="grid gap-x-8 gap-y-5 p-4 md:grid-cols-2">
              {b.byCategory.map((c) => (
                <li key={c.name}>
                  <div className="flex justify-between text-[11.5px]">
                    <span>{c.name}</span>
                    <span className={c.percent > 100 ? 'text-glitch' : 'text-cyan'}>
                      {euros(c.spent)} / {euros(c.allocated)} · {c.percent} %
                    </span>
                  </div>
                  <div className="mt-2">
                    <ProgressBar value={c.percent} height={5} label={`Budget ${c.name}`} />
                  </div>
                </li>
              ))}
            </ul>
          </Panel>

          <Panel title="DÉPENSES" tag={`[${expenses.length}]`}>
            {expenses.length === 0 && <Empty>Aucune dépense.</Empty>}
            <ul className="p-2">
              {expenses.map((e) => (
                <li key={e.id} className="flex items-center gap-3 border-b border-glace/10 px-2 py-2 last:border-0">
                  <span className="w-14 text-[10px] text-ardoise">{shortDate(e.date)}</span>
                  <span className="flex-1 text-[11.5px]">
                    {e.label}
                    <span className="ml-2 text-[9.5px] text-ardoise">
                      {e.category} · {sel.cosplayName(state, e.cosplayId)}
                    </span>
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
        </div>

        <Panel title="NOUVELLE DÉPENSE" className="self-start">
          <form onSubmit={submit} className="flex flex-col gap-3 p-4">
            <Field label="Libellé">
              <input required className="field" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} placeholder="Ex. Satin vert 3 m" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Montant (€)">
                <input required inputMode="decimal" className="field" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
              </Field>
              <Field label="Date">
                <input type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
            </div>
            <Field label="Catégorie">
              <select className="field" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                {state.categories.map((c) => <option key={c.name}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Cosplay">
              <CosplaySelect value={form.cosplayId} onChange={(cosplayId) => setForm({ ...form, cosplayId })} />
            </Field>
            <label className="flex items-center gap-2 text-[11px] text-argent">
              <input type="checkbox" checked={form.paid} onChange={(e) => setForm({ ...form, paid: e.target.checked })} className="accent-cyan" />
              Déjà payé
            </label>
            <Button type="submit" variant="primary">AJOUTER</Button>
          </form>
        </Panel>
      </div>
    </>
  )
}

/** Monthly target, front and center: editable amount + paid / committed / remaining gauge. */
function TargetHero() {
  const { state, today, set } = useStore()
  const b = sel.budgetSummary(state, today)
  const [editing, setEditing] = useState(false)
  const target = Math.max(1, b.target)
  const pct = (n: number) => `${Math.min(100, (n / target) * 100)}%`
  const daysLeft = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate() - today.getDate() + 1
  const over = b.remaining < 0

  return (
    <section className="relative grid gap-6 border border-cyan/40 bg-panel p-5 shadow-[0_0_24px_rgb(92_242_228/0.12)] lg:grid-cols-[260px_minmax(0,1fr)]">
      <div>
        <p className="text-[10px] font-medium tracking-[1.4px] text-cyan">BUDGET CIBLE · {b.month}</p>
        {editing ? (
          <form onSubmit={(e) => (e.preventDefault(), setEditing(false))} className="mt-2 flex items-center gap-2">
            <input
              autoFocus
              type="number"
              min={0}
              aria-label="Budget cible du mois"
              className="field h-14 w-40 font-serif text-[34px] italic"
              value={state.budgetTarget}
              onChange={(e) => set({ budgetTarget: Math.max(0, Number(e.target.value)) })}
              onBlur={() => setEditing(false)}
            />
            <span className="font-serif text-[34px] italic text-argent">€</span>
          </form>
        ) : (
          <button type="button" onClick={() => setEditing(true)} className="group mt-1 flex cursor-pointer items-baseline gap-3 text-left" title="Modifier le budget cible">
            <span className="font-serif text-[64px] leading-none font-medium italic text-chrome">{euros(b.target)}</span>
            <span className="text-[10px] tracking-[0.8px] text-ardoise group-hover:text-cyan">✎ MODIFIER</span>
          </button>
        )}
        <p className="mt-2 text-[10.5px] text-argent">par mois, toutes dépenses confondues</p>
      </div>

      <div className="flex flex-col justify-center gap-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="label-hud">{over ? 'Dépassement' : 'Reste ce mois'}</p>
            <p className={`font-serif text-[40px] leading-none font-medium italic ${over ? 'text-glitch' : 'text-chrome'}`}>{euros(Math.abs(b.remaining))}</p>
          </div>
          {!over && (
            <p className="text-right text-[10.5px] text-argent">
              soit <span className="text-cyan">{euros(b.remaining / daysLeft)} / jour</span>
              <br />
              <span className="text-ardoise">pour les {daysLeft} jours restants</span>
            </p>
          )}
        </div>
        <div className="relative h-3 overflow-hidden rounded-full bg-ailes/9" role="img" aria-label={`Payé ${euros(b.paid)}, engagé ${euros(b.committed)} sur ${euros(b.target)}`}>
          <div className="absolute inset-y-0 left-0 bg-glace/45" style={{ width: pct(b.committed) }} />
          <div className="absolute inset-y-0 left-0 bg-bar" style={{ width: pct(b.paid) }} />
          {over && <div className="absolute inset-0 bg-glitch/40" />}
        </div>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-[10px] tracking-[0.6px]">
          <span className="text-cyan">● PAYÉ {euros(b.paid)}</span>
          <span className="text-glace">● ENGAGÉ {euros(b.committed)}</span>
          <span className="text-ardoise">● LIBRE {euros(Math.max(0, b.remaining))}</span>
          <span className="ml-auto text-ardoise">{Math.round(b.usedPercent)} % du budget utilisé</span>
        </div>
      </div>
      <HudCorners />
    </section>
  )
}
