import type { SpotId } from './spots'

// Data model + date helpers. The local database will store exactly these shapes later.

export type CosplayStatus = 'Prévu' | 'En cours' | 'Fini'
export const STATUSES: CosplayStatus[] = ['Prévu', 'En cours', 'Fini']

export type Cosplay = {
  id: string
  name: string
  series: string
  version: string
  status: CosplayStatus
  /** Manual progress, used only when the cosplay has no tasks */
  progress: number
  /** Position in the sky view (0–1 of the canvas), null = automatic */
  sky: { x: number; y: number } | null
  /** Budget planned for this cosplay (0 = none) */
  budget: number
  /** Small picture/icon of the cosplay (data URL), null = placeholder */
  icon: string | null
}

/** A visual reference (image and/or link) for a cosplay, optionally tied to one piece */
export type Reference = {
  id: string
  cosplayId: string
  pieceId: string | null
  title: string
  /** Image as data URL (null = link-only reference) */
  image: string | null
  url: string
  note: string
  addedAt: string
}
/** Inventory: everything owned, by domain then category */
export type StockDomain = 'couture' | 'craft' | 'wig'
export const DOMAINS: { id: StockDomain; label: string; color: string }[] = [
  { id: 'couture', label: 'Couture', color: '#5cf2e4' },
  { id: 'craft', label: 'Craft', color: '#8f8cff' },
  { id: 'wig', label: 'Wigmaking', color: '#ffd6ec' },
]
export const STOCK_CATEGORIES: Record<StockDomain, string[]> = {
  couture: ['Tissus', 'Mercerie', 'Fils', 'Patrons', 'Doublures & entoilages'],
  craft: ['Mousse & thermoplastiques', 'Peinture & finitions', 'Colles', 'Outils', 'Électronique & LED'],
  wig: ['Perruques', 'Fibres & mèches', 'Produits coiffants', 'Accessoires perruque'],
}
export type StockItem = {
  id: string
  domain: StockDomain
  category: string
  name: string
  qty: number
  unit: string
  /** Alert when qty is at or below this */
  low: number
  note: string
}
export type Material = { id: string; name: string; qty: string }
export type Piece = {
  id: string
  cosplayId: string
  name: string
  /** Place on the mannequin (see spots.ts) */
  spot: SpotId
  /** Manual progress, used only when the piece has no tasks */
  progress: number
  materials: Material[]
  notes: string
}
export type Task = {
  id: string
  title: string
  cosplayId: string | null
  pieceId: string | null
  due: string | null
  estimateMin: number | null
  note: string
  done: boolean
  /** Started but not finished */
  doing: boolean
}
export type Expense = { id: string; label: string; amount: number; category: string; cosplayId: string | null; pieceId: string | null; date: string; paid: boolean }
export type TimeEntry = { id: string; cosplayId: string | null; pieceId: string | null; date: string; minutes: number; note: string }
export type CalendarEvent = { id: string; name: string; city: string; date: string; cosplayId: string | null }
export type Category = { name: string; allocated: number }

export type Collections = {
  cosplays: Cosplay
  pieces: Piece
  refs: Reference
  stock: StockItem
  tasks: Task
  expenses: Expense
  time: TimeEntry
  events: CalendarEvent
}
export type CollectionKey = keyof Collections

export type State = {
  profile: { name: string; roles: string; session: number; motto: string }
  budgetTarget: number
  categories: Category[]
  timer: { cosplayId: string | null; pieceId: string | null; startedAt: number } | null
  lastExport: string | null
} & { [K in CollectionKey]: Collections[K][] }

// ---- dates (local time, ISO yyyy-mm-dd strings) ----
const pad = (n: number) => String(n).padStart(2, '0')
export const iso = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
export const parseDay = (s: string) => {
  const [y, m, d] = s.split('-').map(Number)
  return new Date(y, m - 1, d)
}
export const addDays = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n)
export const startOfWeek = (d: Date) => addDays(d, -((d.getDay() + 6) % 7)) // Monday
export const daysUntil = (day: string, today: Date) =>
  Math.round((parseDay(day).getTime() - parseDay(iso(today)).getTime()) / 86_400_000)

// ---- formatting ----
export const euros = (n: number) => `${Math.round(n).toLocaleString('fr-FR')} €`
export const hours = (minutes: number) => {
  const h = Math.floor(minutes / 60)
  const m = Math.round(minutes % 60)
  return m ? `${h} h ${pad(m)}` : `${h} h`
}
export const shortDate = (day: string) => parseDay(day).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })
export const uid = () => crypto.randomUUID()
export const taskMeta = (cosplay: string, t: Task) =>
  [cosplay !== '—' && cosplay, t.estimateMin && `${t.estimateMin} min`, t.note].filter(Boolean).join(' · ') || '—'
