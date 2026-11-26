import type { Cosplay } from '../../data/model'

// Visual rules from the Figma mock-up (B1 · Ciel des projets)
export const SERIES_COLORS = ['#5cf2e4', '#8f8cff', '#a9c7ff', '#ffd6ec']
const GREEK = 'αβγδεζηθικλμνξοπρστυφχψω'
export const starSize = (progress: number) => 24 + progress / 2 // 0 % → 24px, 100 % → 74px

export type Star = { cosplay: Cosplay; x: number; y: number; progress: number; size: number; color: string; greek: string }
export type Constellation = { series: string; color: string; stars: Star[]; closed: boolean }

/** Deterministic 0–1 pseudo-random number from a string (stable layout between renders). */
const rand = (key: string) => {
  let h = 2166136261
  for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619)
  return (h >>> 0) / 4294967296
}

/**
 * Places every cosplay in the sky: one cluster per series, laid out on a loose grid.
 * Stars the user dragged keep their saved position (`cosplay.sky`).
 */
export function layoutSky(cosplays: Cosplay[], progressOf: (id: string) => number, w: number, h: number): Constellation[] {
  const bySeries = new Map<string, Cosplay[]>()
  for (const c of cosplays) {
    const key = c.series.trim() || 'Sans série'
    bySeries.set(key, [...(bySeries.get(key) ?? []), c])
  }
  const series = [...bySeries.keys()].sort((a, b) => a.localeCompare(b, 'fr'))

  // Usable area (leave room for the header line and the legend)
  const area = { x: 40, y: 90, w: w - 80, h: h - 170 }
  const cols = Math.max(1, Math.ceil(Math.sqrt(series.length * (area.w / area.h))))
  const rows = Math.max(1, Math.ceil(series.length / cols))
  const cellW = area.w / cols
  const cellH = area.h / rows

  const constellations = series.map((name, gi) => {
    const color = SERIES_COLORS[gi % SERIES_COLORS.length]
    const members = bySeries.get(name)!.map((c) => ({ c, p: progressOf(c.id) })).sort((a, b) => b.p - a.p)
    const col = gi % cols
    const row = Math.floor(gi / cols)
    const inRow = Math.min(cols, series.length - row * cols) // center an incomplete last row
    const cx = area.x + (col + 0.5 + (cols - inRow) / 2) * cellW + (rand(name + 'x') - 0.5) * cellW * 0.2
    const cy = area.y + (row + 0.5) * cellH + (rand(name + 'y') - 0.5) * cellH * 0.15
    const radius = Math.min(cellW, cellH) * 0.42
    const base = rand(name) * Math.PI * 2

    const stars = members.map(({ c, p }, i): Star => {
      const angle = base + (i * Math.PI * 2) / members.length + (rand(c.id) - 0.5) * 0.6
      const r = members.length === 1 ? 0 : radius * (0.7 + 0.3 * rand(c.id + 'r'))
      return {
        cosplay: c,
        x: c.sky ? c.sky.x * w : cx + Math.cos(angle) * r,
        y: c.sky ? c.sky.y * h : cy + Math.sin(angle) * r,
        progress: p,
        size: starSize(p),
        color,
        greek: GREEK[i % GREEK.length],
      }
    })
    return { series: name, color, stars, closed: stars.length >= 4 }
  })

  spreadOut(constellations.flatMap((c) => c.stars), area)
  return constellations
}

/** Pushes overlapping stars apart (dragged stars stay where the user put them). */
function spreadOut(stars: Star[], area: { x: number; y: number; w: number; h: number }) {
  for (let iter = 0; iter < 60; iter++) {
    let moved = false
    for (let i = 0; i < stars.length; i++) {
      for (let j = i + 1; j < stars.length; j++) {
        const a = stars[i]
        const b = stars[j]
        const min = (a.size + b.size) * 0.95 + 40
        let dx = b.x - a.x
        let dy = b.y - a.y
        let d = Math.hypot(dx, dy)
        if (d >= min) continue
        if (d < 0.01) [dx, dy, d] = [1, 0, 1] // same spot: push sideways
        const push = (min - d) / 2
        const fa = a.cosplay.sky ? 0 : b.cosplay.sky ? 2 : 1
        const fb = b.cosplay.sky ? 0 : a.cosplay.sky ? 2 : 1
        a.x -= (dx / d) * push * fa
        a.y -= (dy / d) * push * fa
        b.x += (dx / d) * push * fb
        b.y += (dy / d) * push * fb
        moved = true
      }
    }
    for (const s of stars) {
      if (s.cosplay.sky) continue
      s.x = Math.min(area.x + area.w - s.size, Math.max(area.x + s.size, s.x))
      s.y = Math.min(area.y + area.h - s.size, Math.max(area.y + s.size, s.y))
    }
    if (!moved) break
  }
}
