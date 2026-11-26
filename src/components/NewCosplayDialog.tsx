import { useEffect, useRef, useState, type FormEvent } from 'react'
import { Button, Field, Panel } from './ui'
import CosplayIcon from './CosplayIcon'
import { STATUSES, type CosplayStatus } from '../data/model'
import { useStore } from '../data/useStore'

type Props = { onClose: () => void; onCreated: (id: string) => void }

/** Modal to create a cosplay — used by the dashboard shortcut and the Ciel page. */
export default function NewCosplayDialog({ onClose, onCreated }: Props) {
  const { state, add } = useStore()
  const dialog = useRef<HTMLDialogElement>(null)
  const [form, setForm] = useState({ name: '', series: '', version: '', status: 'Idée' as CosplayStatus, budget: '', icon: null as string | null })
  const series = [...new Set(state.cosplays.map((c) => c.series).filter(Boolean))]

  useEffect(() => {
    const d = dialog.current
    d?.showModal()
    return () => d?.close()
  }, [])

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    const id = add('cosplays', {
      name: form.name.trim(),
      series: form.series.trim(),
      version: form.version.trim(),
      status: form.status,
      progress: 0,
      sky: null,
      budget: Math.max(0, Number(form.budget) || 0),
      icon: form.icon,
    })
    onCreated(id)
  }

  return (
    <dialog
      ref={dialog}
      onCancel={(e) => (e.preventDefault(), onClose())}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[440px] max-w-[calc(100vw-32px)] overflow-visible bg-transparent p-0 text-ailes backdrop:bg-nuit/70 backdrop:backdrop-blur-[2px]"
    >
      <Panel title="NOUVEAU COSPLAY" tag="[ESC POUR FERMER]" className="animate-rise shadow-[0_0_32px_rgb(143_140_255/0.3)]">
        <form onSubmit={submit} className="flex flex-col gap-3 p-5">
          <div className="flex items-end gap-4">
            <CosplayIcon icon={form.icon} name={form.name || 'ce cosplay'} size={72} onChange={(icon) => setForm({ ...form, icon })} />
            <Field label="Personnage" className="flex-1">
              <input autoFocus required className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Sailor Moon" />
            </Field>
          </div>
          <Field label="Série (même série = même constellation)">
            <input list="series-options" className="field" value={form.series} onChange={(e) => setForm({ ...form, series: e.target.value })} />
            <datalist id="series-options">{series.map((s) => <option key={s} value={s} />)}</datalist>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Version">
              <input className="field" value={form.version} onChange={(e) => setForm({ ...form, version: e.target.value })} placeholder="Ex. Tenue de combat" />
            </Field>
            <Field label="Budget prévu (€)">
              <input type="number" min={0} className="field" value={form.budget} onChange={(e) => setForm({ ...form, budget: e.target.value })} placeholder="Optionnel" />
            </Field>
          </div>
          <Field label="Statut">
            <select className="field" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value as CosplayStatus })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <div className="mt-2 grid grid-cols-2 gap-3">
            <Button onClick={onClose}>ANNULER</Button>
            <Button type="submit" variant="primary">CRÉER LE COSPLAY</Button>
          </div>
        </form>
      </Panel>
    </dialog>
  )
}
