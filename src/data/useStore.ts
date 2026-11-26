import { createContext, useContext } from 'react'
import type { CollectionKey, Collections, State } from './model'

export type Store = {
  state: State
  today: Date
  /** Adds an item and returns its new id */
  add: <K extends CollectionKey>(key: K, item: Omit<Collections[K], 'id'>) => string
  update: <K extends CollectionKey>(key: K, id: string, patch: Partial<Collections[K]>) => void
  remove: (key: CollectionKey, id: string) => void
  set: (patch: Partial<Pick<State, 'budgetTarget' | 'currentCosplayId'>>) => void
  startTimer: (cosplayId: string | null, pieceId?: string | null) => void
  stopTimer: () => void
  exportJson: () => void
}

export const StoreContext = createContext<Store | null>(null)

export function useStore() {
  const store = useContext(StoreContext)
  if (!store) throw new Error('useStore must be used inside <StoreProvider>')
  return store
}
