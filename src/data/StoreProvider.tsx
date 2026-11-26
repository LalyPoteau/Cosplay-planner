import { useMemo, useState, type ReactNode } from 'react'
import { iso, uid, type CollectionKey, type State } from './model'
import { seed } from './seed'
import { syncStatuses } from './selectors'
import { StoreContext, type Store } from './useStore'

// In-memory for now (refresh = back to sample data). The local database will plug in here.
export default function StoreProvider({ children }: { children: ReactNode }) {
  const [today] = useState(() => new Date())
  const [state, setState] = useState<State>(() => seed(today))

  const actions = useMemo(() => {
    const patchList = (key: CollectionKey, fn: (list: { id: string }[]) => { id: string }[]) =>
      setState((s) => {
        const next = { ...s, [key]: fn(s[key]) }
        return (key === 'tasks' || key === 'pieces' ? syncStatuses(s, next) : next)
      })

    return {
      add: (key, item) => {
        const id = uid()
        patchList(key, (list) => [...list, { ...item, id }])
        return id
      },
      update: (key, id, patch) => patchList(key, (list) => list.map((x) => (x.id === id ? { ...x, ...patch } : x))),
      remove: (key, id) => patchList(key, (list) => list.filter((x) => x.id !== id)),
      set: (patch) => setState((s) => ({ ...s, ...patch })),
      startTimer: (cosplayId, pieceId = null) => setState((s) => ({ ...s, timer: { cosplayId, pieceId, startedAt: Date.now() } })),
      stopTimer: () =>
        setState((s) => {
          if (!s.timer) return s
          const minutes = Math.max(1, Math.round((Date.now() - s.timer.startedAt) / 60_000))
          const entry = { id: uid(), cosplayId: s.timer.cosplayId, pieceId: s.timer.pieceId, date: iso(new Date()), minutes, note: 'Chrono' }
          return { ...s, timer: null, time: [...s.time, entry] }
        }),
    } satisfies Omit<Store, 'state' | 'today' | 'exportJson'>
  }, [])

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `cosplay-planner-${iso(new Date())}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    setState((s) => ({ ...s, lastExport: new Date().toLocaleDateString('fr-FR') }))
  }

  return <StoreContext value={{ state, today, ...actions, exportJson }}>{children}</StoreContext>
}
