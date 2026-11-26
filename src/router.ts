import { useMemo, useSyncExternalStore } from 'react'

export const ROUTES = ['accueil', 'ciel', 'budget', 'temps', 'taches', 'agenda', 'stockage', 'cosplay'] as const
export type Route = (typeof ROUTES)[number]
/** Routes shown in the sidebar */
export type NavRoute = Exclude<Route, 'cosplay'>

const subscribe = (cb: () => void) => {
  window.addEventListener('hashchange', cb)
  return () => window.removeEventListener('hashchange', cb)
}

/** Tiny hash router: `#/budget`, `#/cosplay/<id>`… Back/forward buttons work. */
export function useRoute(): { route: Route; param: string | null; sub: string | null } {
  const hash = useSyncExternalStore(subscribe, () => location.hash)
  return useMemo(() => {
    const [name, param, sub] = hash.replace(/^#\/?/, '').split('/')
    const route = ROUTES.includes(name as Route) ? (name as Route) : 'accueil'
    return { route, param: param ? decodeURIComponent(param) : null, sub: sub || null }
  }, [hash])
}

export const navigate = (route: Route, param?: string) => {
  location.hash = route === 'accueil' ? '/' : `/${route}${param ? `/${encodeURIComponent(param)}` : ''}`
  window.scrollTo(0, 0)
}

export const openCosplay = (id: string) => navigate('cosplay', id)
