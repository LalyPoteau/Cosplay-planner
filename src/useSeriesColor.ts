import { useStore } from './data/useStore'
import { SERIES_COLORS } from './pages/ciel/layout'

/** Series colour (same as in the sky) so a character is recognisable everywhere. */
export function useSeriesColor() {
  const { state } = useStore()
  const series = [...new Set(state.cosplays.map((c) => c.series.trim() || 'Sans série'))].sort((a, b) => a.localeCompare(b, 'fr'))
  return (cosplayId: string) => {
    const c = state.cosplays.find((x) => x.id === cosplayId)
    return SERIES_COLORS[series.indexOf(c?.series.trim() || 'Sans série') % SERIES_COLORS.length]
  }
}
