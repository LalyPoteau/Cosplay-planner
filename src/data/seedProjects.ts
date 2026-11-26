// Temporary sample data for every project: pieces + tasks whose done/total ratio gives exactly
// the project's target progression, plus a budget, older expenses and time logged per piece.
import { addDays, iso, type Expense, type Piece, type Task, type TimeEntry } from './model'
import type { SpotId } from './spots'

type Plan = { id: string; target: number; budget: number; pieces: [string, SpotId][] }

export const PLANS: Plan[] = [
  { id: 'venus', target: 34, budget: 180, pieces: [['Nœud orange', 'col'], ['Corsage', 'poitrine'], ['Jupe orange', 'jupe'], ['Gants', 'main-g'], ['Bottes', 'pieds']] },
  { id: 'mercury', target: 22, budget: 160, pieces: [['Diadème', 'tete-haut'], ['Corsage', 'poitrine'], ['Jupe bleue', 'jupe'], ['Bottes', 'pieds']] },
  { id: 'mars', target: 12, budget: 170, pieces: [['Boucles d’oreilles', 'oreilles'], ['Corsage', 'poitrine'], ['Jupe rouge', 'jupe'], ['Escarpins', 'pieds']] },
  { id: 'vi', target: 76, budget: 220, pieces: [['Perruque rose', 'cheveux'], ['Veste rouge', 'poitrine'], ['Gants de boxe', 'main-g'], ['Pantalon', 'jambes']] },
  { id: 'caitlyn', target: 6, budget: 260, pieces: [['Chapeau', 'tete-haut'], ['Veste d’Enforcer', 'poitrine'], ['Fusil', 'main-d']] },
  { id: 'howl', target: 76, budget: 240, pieces: [['Perruque', 'cheveux'], ['Boucles d’oreilles', 'oreilles'], ['Pendentif', 'cou'], ['Veste rose', 'poitrine']] },
  { id: 'sophie', target: 12, budget: 120, pieces: [['Perruque grise', 'cheveux'], ['Robe bleue', 'poitrine'], ['Tablier', 'taille']] },
  { id: 'calcifer', target: 22, budget: 90, pieces: [['Corps en mousse', 'poitrine'], ['Circuit LED', 'taille'], ['Visage', 'visage']] },
  { id: 'misa', target: 6, budget: 200, pieces: [['Perruque blonde', 'cheveux'], ['Croix', 'cou'], ['Robe gothique', 'poitrine'], ['Bottes', 'pieds']] },
  { id: 'ryuk', target: 22, budget: 300, pieces: [['Masque', 'visage'], ['Ailes', 'epaule-d'], ['Manteau à plumes', 'poitrine']] },
  { id: 'marin', target: 100, budget: 150, pieces: [['Perruque', 'cheveux'], ['Lentilles', 'visage'], ['Uniforme', 'poitrine'], ['Jupe plissée', 'jupe']] },
]

const STEPS = ['Patron', 'Découpe', 'Assemblage', 'Finitions', 'Essayage']
const STEP_MINUTES = [60, 90, 150, 75, 30]

/** Smallest task count n (6–20) whose k/n rounds exactly to the target %. */
function split(target: number) {
  let best = { n: 10, k: Math.round(target / 10), diff: Infinity }
  for (let n = 6; n <= 20; n++) {
    const k = Math.round((target * n) / 100)
    const diff = Math.abs(Math.round((k / n) * 100) - target)
    if (diff < best.diff) best = { n, k, diff }
    if (diff === 0) break
  }
  return best
}

export function seedProjects(today: Date) {
  const d = (n: number) => iso(addDays(today, n))
  const pieces: Piece[] = []
  const tasks: Task[] = []
  const expenses: Expense[] = []
  const time: TimeEntry[] = []

  PLANS.forEach((plan, pi) => {
    const ps = plan.pieces.map(([name, spot], i): Piece => ({
      id: `${plan.id}-p${i}`, cosplayId: plan.id, name, spot, progress: 0, materials: [], notes: '',
    }))
    pieces.push(...ps)

    const { n, k } = split(plan.target)
    for (let i = 0; i < n; i++) {
      const piece = ps[i % ps.length]
      const step = Math.floor(i / ps.length) % STEPS.length
      const done = i < k
      tasks.push({
        id: `${plan.id}-t${i}`,
        title: `${STEPS[step]} — ${piece.name}`,
        cosplayId: plan.id,
        pieceId: piece.id,
        due: done ? d(-16 - (k - i) * 5 - pi * 3) : d(6 + (i - k) * 5 + pi * 2),
        estimateMin: STEP_MINUTES[step],
        note: '',
        done,
        doing: i === k, // the first unfinished step is in progress
      })
      if (done) {
        time.push({ id: `${plan.id}-h${i}`, cosplayId: plan.id, pieceId: piece.id, date: d(-15 - (k - i) * 4 - pi * 3), minutes: STEP_MINUTES[step], note: STEPS[step] })
      }
    }

    expenses.push(
      { id: `${plan.id}-e1`, label: `Fournitures — ${ps[0].name}`, amount: Math.round(plan.budget * 0.3), category: 'Accessoires', cosplayId: plan.id, pieceId: ps[0].id, date: d(-45), paid: true },
      { id: `${plan.id}-e2`, label: `Tissu — ${ps[ps.length - 1].name}`, amount: Math.round(plan.budget * 0.25), category: 'Tissus', cosplayId: plan.id, pieceId: ps[ps.length - 1].id, date: d(-72), paid: true },
    )
  })
  return { pieces, tasks, expenses, time }
}

export const planBudget = (id: string) => PLANS.find((p) => p.id === id)?.budget ?? 0
