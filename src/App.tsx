import { useCallback, useState, type JSX } from 'react'
import BootScreen from './boot/BootScreen'
import Dashboard from './dashboard/Dashboard'
import StoreProvider from './data/StoreProvider'
import Agenda from './pages/Agenda'
import Budget from './pages/Budget'
import Ciel from './pages/Ciel'
import Taches from './pages/Taches'
import Temps from './pages/Temps'
import Stockage from './pages/Stockage'
import CosplayFiche from './pages/cosplay/Fiche'
import { useRoute, type NavRoute } from './router'
import Shell from './Shell'

const PAGES: Record<NavRoute, () => JSX.Element> = {
  accueil: Dashboard,
  ciel: Ciel,
  budget: Budget,
  temps: Temps,
  taches: Taches,
  agenda: Agenda,
  stockage: Stockage,
}

type Phase = 'boot' | 'leaving' | 'ready'

function Page({ route }: { route: NavRoute }) {
  const Component = PAGES[route]
  return <Component />
}

export default function App() {
  // `?noboot` in the URL skips the boot screen (handy while developing)
  const [phase, setPhase] = useState<Phase>(() =>
    new URLSearchParams(location.search).has('noboot') ? 'ready' : 'boot',
  )
  const onLeave = useCallback(() => setPhase('leaving'), [])
  const onDone = useCallback(() => setPhase('ready'), [])
  const { route, param, sub } = useRoute()

  return (
    <StoreProvider>
      {phase !== 'boot' && (
        <Shell route={route === 'cosplay' ? 'ciel' : route} title={route === 'cosplay' ? 'Fiche cosplay' : undefined}>
          {route === 'cosplay' ? <CosplayFiche key={param} id={param ?? ''} initialTab={sub} /> : <Page key={route} route={route} />}
        </Shell>
      )}
      {phase !== 'ready' && <BootScreen onLeave={onLeave} onDone={onDone} />}
    </StoreProvider>
  )
}
