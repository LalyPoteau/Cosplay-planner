// All dashboard numbers are derived here from the raw data — nothing is stored twice.
import { addDays, daysUntil, iso, startOfWeek, type State, type Task } from './model'

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0)
const monthKey = (day: string) => day.slice(0, 7)

export function budgetSummary(s: State, today: Date) {
  const month = s.expenses.filter((e) => monthKey(e.date) === monthKey(iso(today)))
  const committed = sum(month.map((e) => e.amount))
  const paid = sum(month.filter((e) => e.paid).map((e) => e.amount))
  const byCategory = s.categories.map((c) => {
    const spent = sum(month.filter((e) => e.category === c.name).map((e) => e.amount))
    return { ...c, spent, percent: c.allocated ? Math.round((spent / c.allocated) * 100) : 0 }
  })
  return {
    month: today.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '').toUpperCase(),
    target: s.budgetTarget,
    committed,
    paid,
    remaining: s.budgetTarget - committed,
    usedPercent: s.budgetTarget ? (committed / s.budgetTarget) * 100 : 0,
    byCategory,
  }
}

const DAY_LABELS = ['L', 'M', 'M', 'J', 'V', 'S', 'D']

export function weekTime(s: State, today: Date) {
  const monday = startOfWeek(today)
  const minutesOn = (day: string) => sum(s.time.filter((t) => t.date === day).map((t) => t.minutes))
  const days = DAY_LABELS.map((label, i) => {
    const day = iso(addDays(monday, i))
    return { label, day, minutes: minutesOn(day), isToday: day === iso(today) }
  })
  const total = sum(days.map((d) => d.minutes))
  const lastWeek = sum(DAY_LABELS.map((_, i) => minutesOn(iso(addDays(monday, i - 7)))))
  return { days, total, delta: total - lastWeek }
}

export const monthMinutes = (s: State, today: Date) =>
  sum(s.time.filter((t) => monthKey(t.date) === monthKey(iso(today))).map((t) => t.minutes))

export const cosplayMinutes = (s: State, cosplayId: string) =>
  sum(s.time.filter((t) => t.cosplayId === cosplayId).map((t) => t.minutes))

export const cosplaySpent = (s: State, cosplayId: string) =>
  sum(s.expenses.filter((e) => e.cosplayId === cosplayId).map((e) => e.amount))

/**
 * Progress = average of the cosplay's main tasks (board cards: each piece, planned ones included,
 * plus "toute la tenue"). Subtasks only weigh inside their main task.
 * No parts → the manual progress. A finished cosplay is always 100 %.
 */
export function cosplayProgress(s: State, cosplayId: string) {
  const cosplay = s.cosplays.find((c) => c.id === cosplayId)
  if (cosplay?.status === 'Fini') return 100
  const cards = boardCards(s, [cosplayId])
  if (!cards.length) return cosplay?.progress ?? 0
  return Math.round(sum(cards.map((c) => c.progress)) / cards.length)
}

export const hasParts = (s: State, cosplayId: string) => boardCards(s, [cosplayId]).length > 0

const isComplete = (s: State, cosplayId: string) => {
  const cards = boardCards(s, [cosplayId])
  return cards.length > 0 && cards.every((c) => c.progress >= 100)
}

/** After a task/piece change: a cosplay whose parts all just got done becomes "Fini", and goes back to "En cours" if one reopens. */
export function syncStatuses(prev: State, next: State): State {
  let changed = false
  const cosplays = next.cosplays.map((c) => {
    const was = isComplete(prev, c.id)
    const now = isComplete(next, c.id)
    if (now && !was && c.status !== 'Fini') return (changed = true), { ...c, status: 'Fini' as const }
    if (!now && was && c.status === 'Fini') return (changed = true), { ...c, status: 'En cours' as const }
    return c
  })
  return changed ? { ...next, cosplays } : next
}

const byDue = (a: Task, b: Task) => (a.due ?? '9999').localeCompare(b.due ?? '9999')

export function nextEvent(s: State, today: Date) {
  const event = s.events.filter((e) => e.date >= iso(today)).sort((a, b) => a.date.localeCompare(b.date))[0]
  return event ? { event, daysLeft: daysUntil(event.date, today) } : null
}

/** Tasks due today or overdue (still open), plus those due today already done. */
export const todayTasks = (s: State, today: Date) =>
  s.tasks.filter((t) => t.due && (t.due === iso(today) || (t.due < iso(today) && !t.done))).sort(byDue)

export const openTasks = (s: State) => s.tasks.filter((t) => !t.done).length

export const cosplayName = (s: State, id: string | null) => s.cosplays.find((c) => c.id === id)?.name ?? '—'

// ---- stock ----
const norm = (s: string) => s.trim().toLocaleLowerCase('fr')
/** Stock item with the same name as a material, if we own it. */
export const stockFor = (s: State, name: string) => s.stock.find((i) => norm(i.name) === norm(name)) ?? null
/** Pieces whose materials use this stock item. */
export const stockUses = (s: State, name: string) => s.pieces.filter((p) => p.materials.some((m) => norm(m.name) === norm(name)))
export const isLow = (i: { qty: number; low: number }) => i.qty <= i.low

// ---- pieces (fiche cosplay) ----
export const piecesOf = (s: State, cosplayId: string) => s.pieces.filter((p) => p.cosplayId === cosplayId)

/** Piece progress = share of its tasks done; no tasks → manual progress. */
export function pieceProgress(s: State, pieceId: string) {
  const tasks = s.tasks.filter((t) => t.pieceId === pieceId)
  if (!tasks.length) return s.pieces.find((p) => p.id === pieceId)?.progress ?? 0
  return Math.round((tasks.filter((t) => t.done).length / tasks.length) * 100)
}

/** Finished / total main tasks (board cards) of a cosplay — what its progression is computed from. */
export function cosplayPartStats(s: State, cosplayId: string) {
  const cards = boardCards(s, [cosplayId])
  return { done: cards.filter((c) => c.progress >= 100).length, total: cards.length }
}

export function pieceTaskStats(s: State, pieceId: string) {
  const tasks = s.tasks.filter((t) => t.pieceId === pieceId)
  return { done: tasks.filter((t) => t.done).length, total: tasks.length }
}

/** Human-readable explanation of where a progression comes from. */
export const progressSource = ({ done, total }: { done: number; total: number }, finished = false) =>
  finished ? 'cosplay fini' : total ? `${done} / ${total} parties terminées` : 'progression manuelle (aucune partie)'

export const pieceStatus = (progress: number) => (progress >= 100 ? 'Fini' : progress > 0 ? 'En cours' : 'Prévu')

export const pieceMinutes = (s: State, pieceId: string) =>
  sum(s.time.filter((t) => t.pieceId === pieceId).map((t) => t.minutes))

export const pieceName = (s: State, id: string | null) => s.pieces.find((p) => p.id === id)?.name ?? '—'

/** Deadline of a cosplay = its next event, otherwise its next task due date. */
export function cosplayDeadline(s: State, cosplayId: string, today: Date) {
  const event = s.events.filter((e) => e.cosplayId === cosplayId && e.date >= iso(today)).sort((a, b) => a.date.localeCompare(b.date))[0]
  if (event) return { date: event.date, label: event.name }
  const task = s.tasks.filter((t) => t.cosplayId === cosplayId && !t.done && t.due).sort(byDue)[0]
  return task?.due ? { date: task.due, label: task.title } : null
}

// ---- task board (one card per piece = "big part") ----
export type Column = 'prevu' | 'encours' | 'fini'
export const COLUMNS: { id: Column; label: string }[] = [
  { id: 'prevu', label: 'Prévu' },
  { id: 'encours', label: 'En cours' },
  { id: 'fini', label: 'Fini' },
]

export type BoardCard = {
  key: string
  cosplayId: string
  /** null = tasks of the cosplay not tied to a piece ("toute la tenue") */
  pieceId: string | null
  title: string
  tasks: Task[]
  progress: number
  column: Column
  nextDue: string | null
}

const columnOf = (tasks: Task[], manual: number): Column => {
  if (!tasks.length) return manual >= 100 ? 'fini' : manual > 0 ? 'encours' : 'prevu'
  if (tasks.every((t) => t.done)) return 'fini'
  return tasks.some((t) => t.done || t.doing) ? 'encours' : 'prevu'
}

/** Cards of the board: every piece, plus one "toute la tenue" card per cosplay with loose tasks. */
export function boardCards(s: State, cosplayIds: string[]): BoardCard[] {
  const cards: BoardCard[] = []
  for (const cosplayId of cosplayIds) {
    for (const p of piecesOf(s, cosplayId)) {
      const tasks = s.tasks.filter((t) => t.pieceId === p.id)
      const progress = pieceProgress(s, p.id)
      cards.push({ key: p.id, cosplayId, pieceId: p.id, title: p.name, tasks, progress, column: columnOf(tasks, progress), nextDue: nextDue(tasks) })
    }
    const loose = s.tasks.filter((t) => t.cosplayId === cosplayId && !t.pieceId)
    if (loose.length) {
      const progress = Math.round((loose.filter((t) => t.done).length / loose.length) * 100)
      cards.push({ key: `${cosplayId}-loose`, cosplayId, pieceId: null, title: 'Toute la tenue', tasks: loose, progress, column: columnOf(loose, progress), nextDue: nextDue(loose) })
    }
  }
  return cards
}

const nextDue = (tasks: Task[]) => tasks.filter((t) => !t.done && t.due).map((t) => t.due!).sort()[0] ?? null
