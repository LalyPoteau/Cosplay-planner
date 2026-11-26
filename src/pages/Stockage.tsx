import { Fragment, useState, type FormEvent } from 'react'
import { Button, Field, IconButton, PageHeader, Panel } from '../components/ui'
import { DOMAINS, STOCK_CATEGORIES, type StockDomain, type StockItem } from '../data/model'
import * as sel from '../data/selectors'
import { useStore } from '../data/useStore'
import { openCosplay } from '../router'
import { useMediaQuery } from '../useMediaQuery'
import Suggest from '../components/Suggest'

const fmtQty = (n: number) => n.toLocaleString('fr-FR', { maximumFractionDigits: 2 })

export default function Stockage() {
  const { state } = useStore()
  const [domain, setDomain] = useState<StockDomain | null>(null)
  const [query, setQuery] = useState('')
  const [onlyLow, setOnlyLow] = useState(false)

  const q = query.trim().toLocaleLowerCase('fr')
  const items = state.stock.filter(
    (i) => (!q || `${i.name} ${i.note} ${i.category}`.toLocaleLowerCase('fr').includes(q)) && (!onlyLow || sel.isLow(i)),
  )
  const lowCount = state.stock.filter(sel.isLow).length
  const domains = DOMAINS.filter((d) => !domain || d.id === domain)

  return (
    <>
      <PageHeader code="STOCKAGE" title="Stockage" subtitle={`${state.stock.length} articles · ${lowCount} à racheter`}>
        <Field label="Rechercher">
          <input type="search" className="field w-64" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Satin, mousse, perruque…" />
        </Field>
      </PageHeader>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-6 px-6 pt-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-2">
          <div className="flex flex-wrap items-center gap-[10px]">
            {[{ id: null, label: 'TOUT', color: '' }, ...DOMAINS].map((d) => (
              <button
                key={d.label}
                type="button"
                aria-pressed={domain === d.id}
                onClick={() => setDomain(d.id as StockDomain | null)}
                className="h-7 cursor-pointer border border-glace/55 bg-glace/12 px-[13px] text-[10px] font-medium tracking-[0.8px] text-glace uppercase transition hover:bg-glace/20 aria-pressed:border-transparent aria-pressed:bg-cyan/95 aria-pressed:text-nuit"
              >
                {d.color && <span className="mr-2 inline-block size-[6px] rounded-full" style={{ background: d.color }} />}
                {d.label} · {String(d.id ? state.stock.filter((i) => i.domain === d.id).length : state.stock.length).padStart(2, '0')}
              </button>
            ))}
            <label className="ml-auto flex cursor-pointer items-center gap-2 text-[10px] tracking-[0.8px] text-glace">
              <input type="checkbox" checked={onlyLow} onChange={(e) => setOnlyLow(e.target.checked)} className="accent-cyan" />
              À RACHETER SEULEMENT ({lowCount})
            </label>
          </div>

          {domains.map((d) => {
            const cats = [...new Set([...STOCK_CATEGORIES[d.id], ...state.stock.filter((i) => i.domain === d.id).map((i) => i.category)])]
              .map((c) => ({ name: c, items: items.filter((i) => i.domain === d.id && i.category === c) }))
              .filter((c) => c.items.length)
            return (
              <section key={d.id} aria-label={d.label}>
                <h2 className="mb-2 flex items-center gap-3 font-serif text-[24px] font-medium italic" style={{ color: d.color }}>
                  {d.label}
                  <span className="h-px flex-1 bg-linear-to-r from-current to-transparent opacity-40" />
                  <span className="font-mono text-[10px] not-italic tracking-[0.8px] text-ardoise">
                    {items.filter((i) => i.domain === d.id).length} ARTICLES
                  </span>
                </h2>
                {cats.length === 0 ? (
                  <p className="text-[10.5px] text-ardoise">Rien ici {q || onlyLow ? 'pour ce filtre' : 'pour l’instant'}.</p>
                ) : (
                  <div className="columns-1 gap-4 lg:columns-2 2xl:columns-3">
                    {cats.map((c) => (
                      <div key={c.name} className="mb-4 break-inside-avoid">
                        <CategoryPanel name={c.name} items={c.items} color={d.color} />
                      </div>
                    ))}
                  </div>
                )}
              </section>
            )
          })}
        </div>

        <NewItem />
      </div>
    </>
  )
}

function CategoryPanel({ name, items, color }: { name: string; items: StockItem[]; color: string }) {
  const { state, update, remove } = useStore()
  const mobile = useMediaQuery('(max-width: 767px)')
  const [open, setOpen] = useState(false)
  const limit = mobile ? 5 : 15
  const sorted = [...items].sort((a, b) => Number(sel.isLow(b)) - Number(sel.isLow(a)) || a.name.localeCompare(b.name, 'fr'))
  const visible = open ? sorted : sorted.slice(0, limit)
  const step = (i: StockItem) => (i.unit === 'm' ? 0.5 : 1)

  return (
    <Panel title={name.toUpperCase()} tag={`[${items.length}]`}>
      <span className="absolute top-0 left-0 h-full w-[2px] opacity-60" style={{ background: color }} />
      <ul className="px-3 pt-2 pb-1">
        {visible.map((i) => {
          const low = sel.isLow(i)
          const uses = sel.stockUses(state, i.name)
          return (
            <li key={i.id} className="group flex items-center gap-2 border-b border-glace/10 py-2 last:border-0">
              <div className="min-w-0 flex-1">
                <p className={`truncate text-[11.5px] ${low ? 'text-rose' : 'text-ailes'}`}>{i.name}</p>
                <p className="truncate text-[9.5px] text-ardoise">
                  {low && <span className="mr-1 text-glitch">À RACHETER ·</span>}
                  {uses.length > 0 ? (
                    <>utilisé pour{' '}
                      {uses.map((p, k) => (
                        <Fragment key={p.id}>
                          {k > 0 && ', '}
                          <button type="button" onClick={() => openCosplay(p.cosplayId)} className="cursor-pointer text-glace hover:text-cyan hover:underline">
                            {p.name}
                          </button>
                        </Fragment>
                      ))}
                    </>
                  ) : (
                    i.note || '—'
                  )}
                </p>
              </div>
              <div className="flex items-center border border-glace/25">
                <button type="button" aria-label={`Retirer 1 ${i.name}`} onClick={() => update('stock', i.id, { qty: Math.max(0, +(i.qty - step(i)).toFixed(2)) })} className="grid size-6 cursor-pointer place-items-center text-ardoise hover:text-cyan">−</button>
                <span className={`min-w-[64px] px-1 text-center text-[10.5px] ${low ? 'text-glitch' : 'text-cyan'}`}>
                  {fmtQty(i.qty)} {i.unit}
                </span>
                <button type="button" aria-label={`Ajouter 1 ${i.name}`} onClick={() => update('stock', i.id, { qty: +(i.qty + step(i)).toFixed(2) })} className="grid size-6 cursor-pointer place-items-center text-ardoise hover:text-cyan">+</button>
              </div>
              <span className="opacity-0 transition group-hover:opacity-100 focus-within:opacity-100">
                <IconButton label={`Supprimer ${i.name}`} onClick={() => remove('stock', i.id)}>✕</IconButton>
              </span>
            </li>
          )
        })}
      </ul>
      {items.length > limit && (
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="cursor-pointer border-t border-glace/10 py-2 text-[9.5px] tracking-[1px] text-cyan hover:bg-glace/5"
        >
          {open ? 'RÉDUIRE ↑' : `VOIR TOUT · ${items.length - limit} DE PLUS ↓`}
        </button>
      )}
    </Panel>
  )
}

function NewItem() {
  const { state, add, update } = useStore()
  const blank = { domain: 'couture' as StockDomain, category: STOCK_CATEGORIES.couture[0], name: '', qty: '1', unit: '', low: '', note: '' }
  const [form, setForm] = useState(blank)
  const existing = sel.stockFor(state, form.name)

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!form.name.trim()) return
    if (existing) {
      update('stock', existing.id, { qty: +(existing.qty + (Number(form.qty.replace(',', '.')) || 0)).toFixed(2) })
      setForm({ ...blank, domain: form.domain, category: form.category })
      return
    }
    add('stock', {
      domain: form.domain,
      category: form.category.trim() || STOCK_CATEGORIES[form.domain][0],
      name: form.name.trim(),
      qty: Math.max(0, Number(form.qty.replace(',', '.')) || 0),
      unit: form.unit.trim(),
      low: Math.max(0, Number(form.low.replace(',', '.')) || 0),
      note: form.note.trim(),
    })
    setForm({ ...blank, domain: form.domain, category: form.category })
  }

  return (
    <Panel title="AJOUTER AU STOCK" className="self-start xl:sticky xl:top-4">
      <form onSubmit={submit} className="flex flex-col gap-3 p-4">
        <div className="grid grid-cols-3 gap-1">
          {DOMAINS.map((d) => (
            <button
              key={d.id}
              type="button"
              aria-pressed={form.domain === d.id}
              onClick={() => setForm({ ...form, domain: d.id, category: STOCK_CATEGORIES[d.id][0] })}
              className="h-8 cursor-pointer border border-glace/35 text-[9.5px] tracking-[0.6px] text-argent uppercase aria-pressed:border-cyan/70 aria-pressed:bg-glace/10 aria-pressed:text-ailes"
            >
              {d.label}
            </button>
          ))}
        </div>
        <Field label="Catégorie">
          <Suggest
            value={form.category}
            onChange={(category) => setForm({ ...form, category })}
            suggestions={[...new Set([...STOCK_CATEGORIES[form.domain], ...state.stock.filter((i) => i.domain === form.domain).map((i) => i.category)])].map((c) => ({ label: c }))}
            ariaLabel="Catégorie"
          />
        </Field>
        <Field label="Article">
          <Suggest
            value={form.name}
            onChange={(name) => setForm({ ...form, name })}
            onPick={(s) => {
              const item = state.stock.find((i) => i.name === s.label)
              setForm(item ? { ...form, name: item.name, domain: item.domain, category: item.category, unit: item.unit } : { ...form, name: s.label })
            }}
            suggestions={state.stock.map((i) => ({ label: i.name, hint: `${i.qty.toLocaleString('fr-FR')} ${i.unit} · ${i.category}` }))}
            placeholder="Ex. Satin vert"
            ariaLabel="Article"
          />
          {existing && <span className="text-[9.5px] text-cyan">Déjà en stock ({existing.qty.toLocaleString('fr-FR')} {existing.unit}) : la quantité sera ajoutée.</span>}
        </Field>
        <div className="grid grid-cols-3 gap-2">
          <Field label="Quantité"><input inputMode="decimal" className="field" value={form.qty} onChange={(e) => setForm({ ...form, qty: e.target.value })} /></Field>
          <Field label="Unité"><input className="field" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} placeholder="m, pièces…" /></Field>
          <Field label="Alerte ≤"><input inputMode="decimal" className="field" value={form.low} onChange={(e) => setForm({ ...form, low: e.target.value })} placeholder="0" /></Field>
        </div>
        <Field label="Note"><input className="field" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Couleur, magasin, projet…" /></Field>
        <Button type="submit" variant="primary">{existing ? 'AJOUTER À L’EXISTANT' : 'AJOUTER'}</Button>
      </form>
    </Panel>
  )
}
