import { useEffect, useRef, useState, type DragEvent, type FormEvent } from 'react'
import wingsRef from '../../assets/fx/wings-ref.svg'
import camera from '../../assets/icons/camera.svg'
import plusLight from '../../assets/icons/plus-light.svg'
import { Button, Empty, Field, IconButton, Panel } from '../../components/ui'
import { iso, shortDate, type Reference } from '../../data/model'
import * as sel from '../../data/selectors'
import { useStore } from '../../data/useStore'
import { fileToDataUrl, imageFiles } from '../../lib/image'

/** 'all' = every reference, 'none' = not tied to a piece, otherwise a piece id */
export type RefFilter = 'all' | 'none' | string

/** Image of a reference, or the Cyber Angel placeholder (wings + HUD corners). */
export function RefThumb({ image, label = 'RÉF.', className = '' }: { image: string | null; label?: string; className?: string }) {
  return (
    <div className={`relative overflow-hidden border border-glace/45 bg-linear-[236deg] from-[#2a3380] from-13% to-[#0b1030] to-87% ${className}`}>
      {image ? (
        <img src={image} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <>
          <div className="absolute inset-0 bg-linear-[247deg] from-halo/35 from-11% to-cyan/12 to-89%" />
          <img src={wingsRef} alt="" className="absolute top-1/2 left-1/2 w-[130%] max-w-none -translate-1/2 opacity-80" />
          <img src={camera} alt="" className="absolute top-1/2 left-1/2 size-8 -translate-1/2" />
          <div className="scanlines absolute inset-0" />
        </>
      )}
      {['top-2 left-2 border-t-[1.6px] border-l-[1.6px]', 'top-2 right-2 border-t-[1.6px] border-r-[1.6px]', 'bottom-2 left-2 border-b-[1.6px] border-l-[1.6px]', 'bottom-2 right-2 border-b-[1.6px] border-r-[1.6px]'].map((c) => (
        <span key={c} className={`pointer-events-none absolute size-[14px] border-cyan/90 ${c}`} />
      ))}
      <span className="absolute top-[13px] left-[15px] bg-nuit/60 px-1 text-[9.5px] font-medium tracking-[1.33px] text-cyan">{label}</span>
    </div>
  )
}

type Props = { cosplayId: string; filter: RefFilter; setFilter: (f: RefFilter) => void }

export default function References({ cosplayId, filter, setFilter }: Props) {
  const { state, today, add } = useStore()
  const [grouped, setGrouped] = useState(false)
  const [openId, setOpenId] = useState<string | null>(null)
  const [over, setOver] = useState(false)
  const [link, setLink] = useState<{ title: string; url: string } | null>(null)
  const input = useRef<HTMLInputElement>(null)

  const pieces = sel.piecesOf(state, cosplayId)
  const all = state.refs.filter((r) => r.cosplayId === cosplayId).sort((a, b) => b.addedAt.localeCompare(a.addedAt))
  const matches = (r: Reference) => filter === 'all' || (filter === 'none' ? !r.pieceId : r.pieceId === filter)
  const shown = all.filter(matches)
  const targetPiece = filter === 'all' || filter === 'none' ? null : filter

  const addFiles = async (files: File[]) => {
    for (const file of files) {
      add('refs', {
        cosplayId,
        pieceId: targetPiece,
        title: file.name.replace(/\.[^.]+$/, '').replace(/[-_]+/g, ' '),
        image: await fileToDataUrl(file, 1200),
        url: '',
        note: '',
        addedAt: iso(today),
      })
    }
  }

  // Ctrl+V an image anywhere on the tab
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = imageFiles(e.clipboardData?.files)
      if (files.length) {
        e.preventDefault()
        void addFiles(files)
      }
    }
    window.addEventListener('paste', onPaste)
    return () => window.removeEventListener('paste', onPaste)
  })

  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    void addFiles(imageFiles(e.dataTransfer.files))
  }

  const addLink = (e: FormEvent) => {
    e.preventDefault()
    if (!link?.url.trim() && !link?.title.trim()) return
    add('refs', { cosplayId, pieceId: targetPiece, title: link.title.trim() || link.url.trim(), image: null, url: link.url.trim(), note: '', addedAt: iso(today) })
    setLink(null)
  }

  const chips: [RefFilter, string, number][] = [
    ['all', 'TOUTES', all.length],
    ...pieces.map((p): [RefFilter, string, number] => [p.id, p.name.toUpperCase(), all.filter((r) => r.pieceId === p.id).length]),
    ['none', 'TOUTE LA TENUE', all.filter((r) => !r.pieceId).length],
  ]
  const groups = [...pieces.map((p) => ({ id: p.id as string | null, name: p.name })), { id: null, name: 'Toute la tenue' }]
    .map((g) => ({ ...g, refs: shown.filter((r) => r.pieceId === g.id) }))
    .filter((g) => g.refs.length)
  const opened = shown.find((r) => r.id === openId) ?? null

  return (
    <div className="flex flex-col gap-4">
      {/* filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {chips.map(([id, label, count]) => (
            <button
              key={id}
              type="button"
              aria-pressed={filter === id}
              onClick={() => setFilter(id)}
              className="h-7 cursor-pointer border border-glace/55 bg-glace/12 px-3 text-[10px] font-medium tracking-[0.8px] text-glace transition hover:bg-glace/20 aria-pressed:border-transparent aria-pressed:bg-cyan/95 aria-pressed:text-nuit"
            >
              {label} · {String(count).padStart(2, '0')}
            </button>
          ))}
        </div>
        <label className="flex cursor-pointer items-center gap-2 text-[10px] tracking-[0.8px] text-glace">
          <input type="checkbox" checked={grouped} onChange={(e) => setGrouped(e.target.checked)} className="accent-cyan" />
          REGROUPER PAR PIÈCE
        </label>
      </div>

      {/* drop zone */}
      <div
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className={`relative flex flex-wrap items-center justify-between gap-4 border border-dashed px-5 py-4 transition ${over ? 'border-cyan bg-cyan/10' : 'border-glace/40 bg-glace/4'}`}
      >
        <div>
          <p className="text-[12px] font-medium text-ailes">Glisse tes images ici, ou colle-les (Ctrl+V)</p>
          <p className="mt-1 text-[10px] text-ardoise">
            Elles seront rangées dans : <span className="text-cyan">{targetPiece ? sel.pieceName(state, targetPiece) : 'toute la tenue'}</span> — change le filtre au-dessus pour viser une pièce.
          </p>
        </div>
        {link ? (
          <form onSubmit={addLink} className="flex flex-wrap items-end gap-2">
            <Field label="Titre"><input autoFocus className="field w-48" value={link.title} onChange={(e) => setLink({ ...link, title: e.target.value })} placeholder="Ex. Tuto Pinterest" /></Field>
            <Field label="Lien"><input type="url" className="field w-64" value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} placeholder="https://…" /></Field>
            <Button type="submit" variant="primary" className="h-9">AJOUTER</Button>
            <Button className="h-9" onClick={() => setLink(null)}>✕</Button>
          </form>
        ) : (
          <div className="flex gap-2">
            <Button icon={plusLight} onClick={() => input.current?.click()}>IMAGES</Button>
            <Button onClick={() => setLink({ title: '', url: '' })}>🔗 LIEN</Button>
          </div>
        )}
        <input ref={input} type="file" accept="image/*" multiple hidden onChange={(e) => (void addFiles(imageFiles(e.target.files)), (e.target.value = ''))} />
      </div>

      {shown.length === 0 && (
        <Panel title="RÉFÉRENCES">
          <Empty>Aucune référence ici pour l’instant.</Empty>
        </Panel>
      )}

      {grouped
        ? groups.map((g) => (
            <Panel key={g.id ?? 'none'} title={g.name.toUpperCase()} tag={`[${g.refs.length}]`}>
              <RefGrid refs={g.refs} onOpen={setOpenId} />
            </Panel>
          ))
        : shown.length > 0 && (
            <Panel title="RÉFÉRENCES" tag={`[${shown.length}]`}>
              <RefGrid refs={shown} onOpen={setOpenId} />
            </Panel>
          )}

      {opened && (
        <RefViewer
          key={opened.id}
          reference={opened}
          onClose={() => setOpenId(null)}
          onStep={(d) => {
            const i = shown.findIndex((r) => r.id === opened.id)
            setOpenId(shown[(i + d + shown.length) % shown.length].id)
          }}
        />
      )}
    </div>
  )
}

function RefGrid({ refs, onOpen }: { refs: Reference[]; onOpen: (id: string) => void }) {
  const { state, update, remove } = useStore()
  return (
    <ul className="grid gap-4 p-4 [grid-template-columns:repeat(auto-fill,minmax(190px,1fr))]">
      {refs.map((r) => (
        <li key={r.id} className="group flex flex-col gap-2">
          <button type="button" onClick={() => onOpen(r.id)} className="cursor-pointer transition hover:brightness-125 focus-visible:outline-1 focus-visible:outline-cyan" aria-label={`Voir ${r.title}`}>
            <RefThumb image={r.image} label={r.url && !r.image ? 'LIEN' : 'RÉF.'} className="aspect-[4/5] w-full" />
          </button>
          <div className="flex items-start gap-1">
            <input
              aria-label="Titre"
              value={r.title}
              onChange={(e) => update('refs', r.id, { title: e.target.value })}
              className="min-w-0 flex-1 bg-transparent text-[11.5px] font-medium text-ailes focus:text-cyan"
            />
            <IconButton label={`Supprimer ${r.title}`} onClick={() => remove('refs', r.id)}>✕</IconButton>
          </div>
          <div className="flex items-center gap-2">
            <select
              aria-label="Pièce associée"
              className="field h-[24px] min-w-0 flex-1 px-1 text-[9.5px]"
              value={r.pieceId ?? ''}
              onChange={(e) => update('refs', r.id, { pieceId: e.target.value || null })}
            >
              <option value="">Toute la tenue</option>
              {sel.piecesOf(state, r.cosplayId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <span className="text-[9px] text-ardoise">{shortDate(r.addedAt)}</span>
          </div>
        </li>
      ))}
    </ul>
  )
}

function RefViewer({ reference: r, onClose, onStep }: { reference: Reference; onClose: () => void; onStep: (delta: number) => void }) {
  const { state, update } = useStore()
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    const d = dialog.current
    if (!d?.open) d?.showModal()
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLTextAreaElement) return
      if (e.key === 'ArrowRight') onStep(1)
      if (e.key === 'ArrowLeft') onStep(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onStep])

  return (
    <dialog
      ref={dialog}
      onCancel={(e) => (e.preventDefault(), onClose())}
      onClick={(e) => e.target === e.currentTarget && onClose()}
      className="m-auto w-[min(1100px,calc(100vw-48px))] overflow-visible bg-transparent p-0 text-ailes backdrop:bg-nuit/80 backdrop:backdrop-blur-[2px]"
    >
      <Panel title={r.title.toUpperCase() || 'RÉFÉRENCE'} tag="← → POUR NAVIGUER · ESC" className="animate-rise">
        <div className="grid gap-5 p-5 md:grid-cols-[minmax(0,1fr)_300px]">
          <div className="relative grid min-h-[300px] place-items-center bg-nuit/50">
            {r.image ? (
              <img src={r.image} alt={r.title} className="max-h-[70vh] max-w-full object-contain" />
            ) : (
              <RefThumb image={null} label={r.url ? 'LIEN' : 'RÉF.'} className="aspect-[4/5] w-[260px]" />
            )}
            <button type="button" aria-label="Précédente" onClick={() => onStep(-1)} className="absolute top-1/2 left-2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center border border-glace/50 bg-nuit/70 text-[18px] hover:text-cyan">‹</button>
            <button type="button" aria-label="Suivante" onClick={() => onStep(1)} className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 cursor-pointer place-items-center border border-glace/50 bg-nuit/70 text-[18px] hover:text-cyan">›</button>
          </div>
          <div className="flex flex-col gap-3">
            <Field label="Titre"><input className="field" value={r.title} onChange={(e) => update('refs', r.id, { title: e.target.value })} /></Field>
            <Field label="Pièce associée">
              <select className="field" value={r.pieceId ?? ''} onChange={(e) => update('refs', r.id, { pieceId: e.target.value || null })}>
                <option value="">Toute la tenue</option>
                {sel.piecesOf(state, r.cosplayId).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </Field>
            <Field label="Lien"><input type="url" className="field" value={r.url} onChange={(e) => update('refs', r.id, { url: e.target.value })} placeholder="https://…" /></Field>
            {r.url && (
              <a href={r.url} target="_blank" rel="noreferrer noopener" className="text-[10.5px] text-cyan underline underline-offset-2">Ouvrir le lien ↗</a>
            )}
            <Field label="Notes">
              <textarea className="field h-40 resize-y py-2 leading-[1.5]" value={r.note} onChange={(e) => update('refs', r.id, { note: e.target.value })} placeholder="Ce qui t’intéresse dans cette référence…" />
            </Field>
            <Button className="mt-auto" onClick={onClose}>FERMER</Button>
          </div>
        </div>
      </Panel>
    </dialog>
  )
}
