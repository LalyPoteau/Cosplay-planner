import { useState, type ReactNode } from 'react'
import { PageHeader } from '../components/ui'
import * as sel from '../data/selectors'
import { useStore } from '../data/useStore'
import { useSeriesColor } from '../useSeriesColor'
import Board, { QuickTask } from './taches/Board'

/** Task board: one card per piece, grouped in Prévu / En cours / Fini, filterable by character. */
export default function Taches() {
  const { state } = useStore()
  const color = useSeriesColor()
  const [who, setWho] = useState<string>('all')
  const [hideDone, setHideDone] = useState(false)

  // characters that have something on the board, those in work first
  const characters = state.cosplays
    .filter((c) => sel.boardCards(state, [c.id]).length)
    .sort((a, b) => Number(b.status === 'En cours') - Number(a.status === 'En cours'))
  const ids = who === 'all' ? characters.map((c) => c.id) : [who]
  const open = state.tasks.filter((t) => !t.done)

  return (
    <>
      <PageHeader
        code="TÂCHES"
        title="Tâches"
        subtitle={`${open.length} à faire · ${open.filter((t) => t.doing).length} en cours · une carte par pièce, clique pour le détail`}
      />

      <div className="flex flex-col gap-4 px-6 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <Chip active={who === 'all'} onClick={() => setWho('all')}>TOUS · {String(characters.length).padStart(2, '0')}</Chip>
          {characters.map((c) => (
            <Chip key={c.id} active={who === c.id} onClick={() => setWho(c.id)}>
              <span className="mr-2 inline-block size-[6px] rounded-full" style={{ background: color(c.id) }} />
              {c.name} · {sel.boardCards(state, [c.id]).filter((k) => k.column !== 'fini').length}
            </Chip>
          ))}
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-[10px] tracking-[0.8px] text-glace">
            <input type="checkbox" checked={hideDone} onChange={(e) => setHideDone(e.target.checked)} className="accent-cyan" />
            MASQUER LES FINIS
          </label>
        </div>

        <QuickTask key={who} cosplayId={who === 'all' ? undefined : who} />
        <Board cosplayIds={ids} showCosplay={who === 'all'} hideDone={hideDone} />
      </div>
    </>
  )
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className="h-7 cursor-pointer border border-glace/55 bg-glace/12 px-3 text-[10px] font-medium tracking-[0.8px] text-glace uppercase transition hover:bg-glace/20 aria-pressed:border-transparent aria-pressed:bg-cyan/95 aria-pressed:text-nuit"
    >
      {children}
    </button>
  )
}
