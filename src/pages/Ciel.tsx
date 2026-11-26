import { useState } from 'react'
import eclat from '../assets/icons/eclat.svg'
import plusDark from '../assets/icons/plus-dark.svg'
import CosplayIcon from '../components/CosplayIcon'
import NewCosplayDialog from '../components/NewCosplayDialog'
import { Button, Chip, IconButton, PageHeader, Panel, ProgressBar } from '../components/ui'
import { euros, hours, STATUSES, type CosplayStatus } from '../data/model'
import * as sel from '../data/selectors'
import { useStore } from '../data/useStore'
import { openCosplay } from '../router'
import Sky from './ciel/Sky'

type View = 'ciel' | 'galerie'

export default function Ciel() {
  const { state } = useStore()
  const [view, setView] = useState<View>('ciel')
  const [filter, setFilter] = useState<CosplayStatus | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)

  const visible = new Set(state.cosplays.filter((c) => !filter || c.status === filter).map((c) => c.id))
  const chips: [CosplayStatus | null, string, number][] = [
    [null, 'TOUS', state.cosplays.length],
    ...STATUSES.map((s): [CosplayStatus, string, number] => [s, s.toUpperCase(), state.cosplays.filter((c) => c.status === s).length]),
  ]

  return (
    <>
      <PageHeader code="CIEL DES PROJETS" title="Ciel des projets" subtitle="Chaque étoile est un costume. Chaque constellation, une série.">
        <div className="flex items-center gap-3">
          <div role="group" aria-label="Affichage" className="flex h-8 border border-glace/35 bg-glace/6 p-[2px]">
            {(['ciel', 'galerie'] as const).map((v) => (
              <button
                key={v}
                type="button"
                aria-pressed={view === v}
                onClick={() => setView(v)}
                className="flex cursor-pointer items-center gap-[6px] px-3 text-[9px] tracking-[0.72px] text-argent uppercase transition aria-pressed:border aria-pressed:border-cyan/70 aria-pressed:bg-linear-to-r aria-pressed:from-halo/55 aria-pressed:to-cyan/20 aria-pressed:font-medium aria-pressed:text-ailes"
              >
                {v === 'ciel' ? <img src={eclat} alt="" className="size-4" /> : <span aria-hidden className="text-[13px] leading-none">▦</span>}
                {v}
              </button>
            ))}
          </div>
          <Button variant="primary" icon={plusDark} className="h-8 w-[208px]" onClick={() => setAdding(true)}>
            NOUVEAU COSPLAY
          </Button>
        </div>
      </PageHeader>

      <div className="relative px-6 pt-4">
        <div className="mb-4 flex flex-wrap gap-[10px]">
          {chips.map(([status, label, count]) => (
            <button
              key={label}
              type="button"
              aria-pressed={filter === status}
              onClick={() => setFilter(status)}
              className="h-7 cursor-pointer border border-glace/55 bg-glace/12 px-[13px] text-[10px] font-medium tracking-[0.8px] text-glace transition hover:bg-glace/20 aria-pressed:border-transparent aria-pressed:bg-cyan/95 aria-pressed:text-nuit"
            >
              {label} · {String(count).padStart(2, '0')}
            </button>
          ))}
        </div>

        {adding && (
          <NewCosplayDialog
            onClose={() => setAdding(false)}
            onCreated={(id) => {
              setAdding(false)
              setSelectedId(id)
            }}
          />
        )}

        {view === 'ciel' ? (
          <Sky visible={visible} selectedId={selectedId} onSelect={setSelectedId} onOpen={openCosplay} />
        ) : (
          <Gallery visible={visible} />
        )}
      </div>
    </>
  )
}

function Gallery({ visible }: { visible: Set<string> }) {
  const { state, update, remove } = useStore()

  return (
    <ul className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {state.cosplays
        .filter((c) => visible.has(c.id))
        .map((c) => {
          const progress = sel.cosplayProgress(state, c.id)
          const manual = !sel.hasParts(state, c.id) && c.status !== 'Fini'
          return (
            <li key={c.id}>
              <Panel title={c.series.toUpperCase() || 'SANS SÉRIE'} className="h-full">
                <div className="flex flex-1 flex-col gap-3 px-4 pt-3 pb-4">
                  <div className="flex items-start justify-between gap-2">
                    <CosplayIcon icon={c.icon} name={c.name} size={48} onChange={(icon) => update('cosplays', c.id, { icon })} />
                    <div className="flex-1">
                      <p className="font-serif text-[28px] leading-[34px] font-medium italic text-chrome">{c.name}</p>
                      <p className="text-[10.5px] text-argent">{c.version || '—'}</p>
                    </div>
                    <IconButton label={`Supprimer ${c.name}`} onClick={() => confirm(`Supprimer ${c.name} ?`) && remove('cosplays', c.id)}>✕</IconButton>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      aria-label="Statut"
                      value={c.status}
                      onChange={(e) => update('cosplays', c.id, { status: e.target.value as CosplayStatus })}
                      className="field h-[26px] text-[10.5px]"
                    >
                      {STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <Chip tone="glace">{progress} %</Chip>
                  </div>
                  {manual ? (
                    <label className="flex items-center gap-2 text-[9.5px] text-ardoise">
                      MANUEL
                      <input
                        type="range" min={0} max={100} step={1} value={c.progress}
                        onChange={(e) => update('cosplays', c.id, { progress: Number(e.target.value) })}
                        className="flex-1 accent-cyan"
                        aria-label={`Progression de ${c.name}`}
                      />
                    </label>
                  ) : (
                    <ProgressBar value={progress} label={`Avancement ${c.name}`} />
                  )}
                  <p className="text-[10px] text-ardoise">
                    {sel.progressSource(sel.cosplayPartStats(state, c.id), c.status === 'Fini')} · {hours(sel.cosplayMinutes(state, c.id))} ·{' '}
                    {euros(sel.cosplaySpent(state, c.id))}
                  </p>
                  <div className="mt-auto flex gap-2">
                    <Button variant="primary" className="h-8" onClick={() => openCosplay(c.id)}>
                      OUVRIR LA FICHE
                    </Button>
                  </div>
                </div>
              </Panel>
            </li>
          )
        })}
    </ul>
  )
}
