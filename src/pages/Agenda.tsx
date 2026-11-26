import { useState, type FormEvent } from 'react'
import { Button, Chip, Empty, Field, IconButton, PageHeader, Panel } from '../components/ui'
import { daysUntil, iso, parseDay, type CalendarEvent } from '../data/model'
import * as sel from '../data/selectors'
import { useStore } from '../data/useStore'
import Calendar from './agenda/Calendar'
import { CosplaySelect } from './shared'

export default function Agenda() {
  const { state, today, add, remove } = useStore()
  const blank = { name: '', city: '', date: '', cosplayId: state.currentCosplayId }
  const [form, setForm] = useState(blank)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim() || !form.date) return
    add('events', { ...form, name: form.name.trim(), city: form.city.trim() })
    setForm(blank)
  }

  const sorted = [...state.events].sort((a, b) => a.date.localeCompare(b.date))
  const upcoming = sorted.filter((e) => e.date >= iso(today))
  const past = sorted.filter((e) => e.date < iso(today)).reverse()

  const row = (e: CalendarEvent, isPast: boolean) => {
    const date = parseDay(e.date)
    return (
      <li key={e.id} className={`flex items-center gap-4 border-b border-glace/10 px-4 py-3 last:border-0 ${isPast ? 'opacity-50' : ''}`}>
        <div className="flex h-14 w-12 shrink-0 flex-col items-center justify-center border border-glace/50 bg-tile">
          <span className="font-serif text-[24px] leading-none font-medium italic text-chrome">{e.date.slice(8, 10)}</span>
          <span className="text-[8.5px] tracking-[1px] text-cyan">{date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase()}</span>
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-medium">{e.name}</p>
          <p className="text-[10.5px] text-argent">
            {[e.city, sel.cosplayName(state, e.cosplayId), date.getFullYear()].filter((x) => x && x !== '—').join(' · ')}
          </p>
        </div>
        {!isPast && <Chip>J-{daysUntil(e.date, today)}</Chip>}
        <IconButton label={`Supprimer ${e.name}`} onClick={() => remove('events', e.id)}>✕</IconButton>
      </li>
    )
  }

  return (
    <>
      <PageHeader code="AGENDA" title="Agenda" subtitle={`${upcoming.length} événements à venir`} />

      <div className="grid gap-6 px-6 pt-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="grid min-w-0 items-start gap-4 lg:grid-cols-2">
          <Panel title="À VENIR" tag={`[${upcoming.length}]`}>
            {upcoming.length === 0 && <Empty>Aucun événement prévu.</Empty>}
            <ul className="pt-2">{upcoming.map((e) => row(e, false))}</ul>
          </Panel>
          <Panel title="PASSÉS" tag={`[${past.length}]`}>
            {past.length === 0 && <Empty>Pas encore d’événement passé.</Empty>}
            <ul className="pt-2">{past.map((e) => row(e, true))}</ul>
          </Panel>
        </div>

        <Panel title="NOUVEL ÉVÉNEMENT" className="self-start">
          <form onSubmit={submit} className="flex flex-col gap-3 p-4">
            <Field label="Convention / shooting">
              <input id="event-name" required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Japan Expo" />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Ville">
                <input className="field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="Date">
                <input required type="date" className="field" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
              </Field>
            </div>
            <Field label="Cosplay porté">
              <CosplaySelect value={form.cosplayId} onChange={(cosplayId) => setForm({ ...form, cosplayId })} />
            </Field>
            <Button type="submit" variant="primary">AJOUTER</Button>
          </form>
        </Panel>
      </div>

      <div className="px-6 pt-6">
        <Calendar
          selectedDay={form.date}
          onPickDay={(day) => {
            setForm((f) => ({ ...f, date: day }))
            const input = document.getElementById('event-name')
            input?.scrollIntoView({ behavior: 'smooth', block: 'center' })
            input?.focus({ preventScroll: true })
          }}
        />
      </div>
    </>
  )
}
