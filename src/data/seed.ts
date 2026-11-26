import { addDays, iso, startOfWeek, type Cosplay, type CosplayStatus, type Material, type Piece, type State } from './model'
import type { SpotId } from './spots'
import { planBudget, seedProjects } from './seedProjects'
import type { StockDomain, StockItem } from './model'

const piece = (id: string, name: string, spot: SpotId, progress: number, materials: Material[], notes = ''): Piece => ({
  id, cosplayId: 'jupiter', name, spot, progress, materials, notes,
})

let stockId = 0
const item = (domain: StockDomain, category: string, name: string, qty: number, unit: string, low = 0, note = ''): StockItem => ({
  id: `s${++stockId}`, domain, category, name, qty, unit, low, note,
})

const cos = (id: string, name: string, series: string, version: string, status: CosplayStatus, progress = 0): Cosplay => ({
  id, name, series, version, status, progress, sky: null, budget: id === 'jupiter' ? 500 : id === 'jinx' ? 250 : planBudget(id), icon: null,
})

/** Sample data, placed relative to `today` so the dashboard always looks alive. */
export function seed(today: Date): State {
  const d = (n: number) => iso(addDays(today, n))
  const monday = startOfWeek(today)

  // Time logged this week (only up to today) and last week
  const thisWeek = [75, 121, 53, 151, 106, 181, 63]
  const lastWeek = [60, 90, 45, 120, 80, 150, 85]
  const time: State['time'] = []
  thisWeek.forEach((minutes, i) => {
    const day = addDays(monday, i)
    if (day <= today) time.push({ id: `tw${i}`, cosplayId: i % 3 === 2 ? 'jinx' : 'jupiter', pieceId: i % 3 === 0 ? 'p-gants' : null, date: iso(day), minutes, note: '' })
  })
  lastWeek.forEach((minutes, i) =>
    time.push({ id: `lw${i}`, cosplayId: 'jupiter', pieceId: i % 2 ? 'p-corsage' : 'p-jupe', date: iso(addDays(monday, i - 7)), minutes, note: '' }),
  )

  const extra = seedProjects(today)

  return {
    profile: { name: 'Laly', roles: 'Costumière · Cosplayeuse · Depuis 2024', session: 47, motto: 'Une couture à la fois.' },
    budgetTarget: 500,
    categories: [
      { name: 'Tissus', allocated: 250 },
      { name: 'Accessoires', allocated: 200 },
      { name: 'Perruque', allocated: 150 },
      { name: 'Chaussures', allocated: 125 },
      { name: 'Maquillage', allocated: 75 },
    ],
    timer: null,
    lastExport: null,
    cosplays: [
      cos('jupiter', 'Sailor Jupiter', 'Sailor Moon', 'Version classique', 'En cours'),
      cos('venus', 'Sailor Venus', 'Sailor Moon', 'Version classique', 'En cours', 34),
      cos('mercury', 'Sailor Mercury', 'Sailor Moon', 'Version classique', 'Prévu', 22),
      cos('mars', 'Sailor Mars', 'Sailor Moon', 'Version classique', 'Prévu', 12),
      cos('jinx', 'Jinx', 'Arcane', 'Saison 2', 'En cours'),
      cos('vi', 'Vi', 'Arcane', 'Saison 2', 'En cours', 76),
      cos('caitlyn', 'Caitlyn', 'Arcane', 'Enforcer', 'Prévu', 6),
      cos('howl', 'Howl', 'Le Château ambulant', 'Veste rose', 'En cours', 76),
      cos('sophie', 'Sophie', 'Le Château ambulant', 'Robe bleue', 'Prévu', 12),
      cos('calcifer', 'Calcifer', 'Le Château ambulant', 'Peluche lumineuse', 'Prévu', 22),
      cos('misa', 'Misa Amane', 'Death Note', 'Gothic Lolita', 'Prévu', 6),
      cos('ryuk', 'Ryuk', 'Death Note', 'Ailes en mousse', 'Prévu', 22),
      cos('marin', 'Marin Kitagawa', 'My Dress-Up Darling', 'Uniforme', 'Fini'),
    ],
    tasks: [
      ...extra.tasks,
      { id: 'k1', title: 'Tester le patron des gants', cosplayId: 'jupiter', pieceId: 'p-gants', due: d(0), estimateMin: 45, note: '', done: false, doing: true },
      { id: 'k2', title: 'Commander la mousse EVA', cosplayId: 'jinx', pieceId: 'jinx-fish', due: d(0), estimateMin: null, note: 'en ligne', done: false, doing: false },
      { id: 'k3', title: 'Trier les références tissu', cosplayId: 'jupiter', pieceId: null, due: d(0), estimateMin: null, note: '', done: true, doing: false },
      { id: 'k4', title: 'Essai maquillage', cosplayId: 'jinx', pieceId: 'jinx-makeup', due: d(0), estimateMin: 30, note: '', done: false, doing: false },
      { id: 'k5', title: 'Assembler les gants', cosplayId: 'jupiter', pieceId: 'p-gants', due: d(12), estimateMin: 24, note: '', done: false, doing: false },
      { id: 'k6', title: 'Coudre la jupe plissée', cosplayId: 'jupiter', pieceId: 'p-jupe', due: d(20), estimateMin: 180, note: '', done: false, doing: false },
      { id: 'k7', title: 'Patronage du corsage', cosplayId: 'jupiter', pieceId: 'p-corsage', due: d(-10), estimateMin: 120, note: '', done: true, doing: false },
      { id: 'k8', title: 'Découpe du satin vert', cosplayId: 'jupiter', pieceId: 'p-jupe', due: d(-8), estimateMin: 90, note: '', done: true, doing: false },
      { id: 'k9', title: 'Couture du col marin', cosplayId: 'jupiter', pieceId: 'p-corsage', due: d(-6), estimateMin: 150, note: '', done: true, doing: false },
      { id: 'k10', title: 'Broche rose', cosplayId: 'jupiter', pieceId: 'p-broche', due: d(-4), estimateMin: 60, note: '', done: true, doing: false },
      { id: 'k11', title: 'Ruban dos', cosplayId: 'jupiter', pieceId: 'p-corsage', due: d(-2), estimateMin: 40, note: '', done: true, doing: false },
      { id: 'k12', title: 'Coiffer la perruque', cosplayId: 'jinx', pieceId: 'jinx-wig', due: d(5), estimateMin: 90, note: '', done: false, doing: true },
      { id: 'k15', title: 'Poser l’élastique', cosplayId: 'jupiter', pieceId: 'p-gants', due: d(3), estimateMin: 30, note: '', done: false, doing: false },
      { id: 'k16', title: 'Ourler les bords', cosplayId: 'jupiter', pieceId: 'p-gants', due: d(4), estimateMin: 45, note: '', done: false, doing: false },
      { id: 'k17', title: 'Patronage des gants', cosplayId: 'jupiter', pieceId: 'p-gants', due: d(-11), estimateMin: 60, note: '', done: true, doing: false },
      { id: 'k18', title: 'Coudre les doigts', cosplayId: 'jupiter', pieceId: 'p-gants', due: d(-3), estimateMin: 120, note: '', done: true, doing: false },
      { id: 'k19', title: 'Poser la fermeture', cosplayId: 'jupiter', pieceId: 'p-corsage', due: d(8), estimateMin: 60, note: '', done: false, doing: true },
      { id: 'k13', title: 'Tresser la perruque', cosplayId: 'jinx', pieceId: 'jinx-wig', due: d(-12), estimateMin: 120, note: '', done: true, doing: false },
      { id: 'k14', title: 'Peindre le Fishbones', cosplayId: 'jinx', pieceId: 'jinx-fish', due: d(-5), estimateMin: 180, note: '', done: true, doing: false },
    ],
    pieces: [
      ...extra.pieces,
      { id: 'jinx-wig', cosplayId: 'jinx', name: 'Perruque tresses', spot: 'cheveux', progress: 0, materials: [{ id: 'jm1', name: 'Perruque bleue tresses', qty: '1' }], notes: '' },
      { id: 'jinx-makeup', cosplayId: 'jinx', name: 'Maquillage & tatouages', spot: 'visage', progress: 0, materials: [], notes: '' },
      { id: 'jinx-fish', cosplayId: 'jinx', name: 'Fishbones', spot: 'main-d', progress: 0, materials: [{ id: 'jm2', name: 'Mousse EVA 5 mm', qty: '2 plaques' }], notes: 'Le lance-roquettes requin.' },
      piece('p-diademe', 'Diadème', 'tete-haut', 100, [{ id: 'm1', name: 'Fil de fer doré', qty: '1 m' }, { id: 'm2', name: 'Strass vert', qty: '1 pièce' }]),
      piece('p-boucles', 'Boucles d’oreilles', 'oreilles', 0, [{ id: 'm3', name: 'Perles roses', qty: '2' }]),
      piece('p-corsage', 'Corsage marin', 'poitrine', 0, [{ id: 'm4', name: 'Satin vert', qty: '1,5 m' }, { id: 'm5', name: 'Tissu blanc', qty: '1 m' }]),
      piece('p-broche', 'Broche rose', 'col', 0, []),
      piece('p-gants', 'Gants de satin', 'main-g', 0, [{ id: 'm6', name: 'Satin blanc', qty: '0,5 m' }, { id: 'm7', name: 'Fil élastique', qty: '1 bobine' }],
        'Piquer à 5 mm du bord. Tester la tension avant de fermer la couture. Échantillon validé le 19/11.'),
      piece('p-jupe', 'Jupe plissée', 'jupe', 0, [{ id: 'm8', name: 'Satin vert', qty: '2 m' }]),
      piece('p-bottes', 'Bottes', 'pieds', 0, [{ id: 'm9', name: 'Couvre-bottes vert', qty: '1 paire' }]),
    ],
    stock: [
      ...[
        ['Satin vert', 1.5, 'm', 'Sailor Jupiter'], ['Satin blanc', 0.5, 'm'], ['Tissu blanc', 3, 'm'], ['Crêpe bleu nuit', 2, 'm'],
        ['Velours rouge', 1, 'm'], ['Tulle ivoire', 4, 'm'], ['Simili cuir noir', 1.2, 'm'], ['Lycra chair', 0.8, 'm'],
        ['Jersey gris', 2.5, 'm'], ['Organza rose', 1.5, 'm'], ['Coton imprimé fleurs', 1, 'm'], ['Brocart doré', 0.6, 'm'],
        ['Lin naturel', 2, 'm'], ['Polaire violette', 1, 'm'], ['Taffetas vert d’eau', 0.5, 'm'], ['Dentelle noire', 3, 'm'],
        ['Néoprène bleu', 0.7, 'm'],
      ].map(([n, q, u, note]) => item('couture', 'Tissus', n as string, q as number, u as string, 0.5, (note as string) ?? '')),
      item('couture', 'Mercerie', 'Fermeture invisible 40 cm', 3, 'pièces', 1),
      item('couture', 'Mercerie', 'Boutons dorés', 12, 'pièces', 4),
      item('couture', 'Mercerie', 'Pressions', 20, 'pièces', 6),
      item('couture', 'Mercerie', 'Ruban satin rose', 2, 'm', 1),
      item('couture', 'Mercerie', 'Biais blanc', 0, 'm', 1),
      item('couture', 'Fils', 'Fil élastique', 1, 'bobine', 1),
      item('couture', 'Fils', 'Fil polyester blanc', 3, 'bobines', 1),
      item('couture', 'Fils', 'Fil vert', 1, 'bobine', 1),
      item('couture', 'Patrons', 'Patron corset 6 panneaux', 1, '', 0, 'Taille 38'),
      item('couture', 'Doublures & entoilages', 'Entoilage thermocollant', 2, 'm', 0.5),
      item('craft', 'Mousse & thermoplastiques', 'Mousse EVA 5 mm', 2, 'plaques', 1),
      item('craft', 'Mousse & thermoplastiques', 'Mousse EVA 2 mm', 1, 'plaque', 1),
      item('craft', 'Mousse & thermoplastiques', 'Worbla', 0.5, 'plaque', 0.5),
      item('craft', 'Peinture & finitions', 'Plasti Dip noir', 1, 'bombe', 1),
      item('craft', 'Peinture & finitions', 'Acrylique doré', 2, 'pots', 1),
      item('craft', 'Peinture & finitions', 'Vernis mat', 1, 'pot'),
      item('craft', 'Colles', 'Colle contact', 1, 'tube', 1),
      item('craft', 'Colles', 'Bâtons colle chaude', 25, 'bâtons', 10),
      item('craft', 'Outils', 'Pistolet à chaleur', 1, ''),
      item('craft', 'Outils', 'Cutter', 2, ''),
      item('craft', 'Électronique & LED', 'Ruban LED cyan', 1, 'm', 0, 'Pour le halo'),
      item('wig', 'Perruques', 'Perruque brune longue', 1, '', 0, 'Pour Sailor Jupiter'),
      item('wig', 'Perruques', 'Perruque bleue tresses', 1, '', 0, 'Jinx'),
      item('wig', 'Perruques', 'Perruque blonde courte', 1, ''),
      item('wig', 'Fibres & mèches', 'Mèches roses', 2, 'paquets', 1),
      item('wig', 'Produits coiffants', 'Got2b glued', 1, 'bombe', 1),
      item('wig', 'Produits coiffants', 'Spray démêlant', 0, 'flacon', 1),
      item('wig', 'Accessoires perruque', 'Tête en polystyrène', 2, ''),
    ],
    refs: [
      { id: 'r1', cosplayId: 'jupiter', pieceId: null, title: 'Planche officielle', image: null, url: '', note: 'Vue face / dos, couleurs de l’anime.', addedAt: d(-14) },
      { id: 'r2', cosplayId: 'jupiter', pieceId: 'p-gants', title: 'Tuto gants opéra', image: null, url: '', note: 'Patron à 4 pièces, élastique au poignet.', addedAt: d(-9) },
      { id: 'r3', cosplayId: 'jupiter', pieceId: 'p-diademe', title: 'Diadème — détail de la pierre', image: null, url: '', note: '', addedAt: d(-6) },
    ],
    expenses: [
      ...extra.expenses,
      { id: 'e1', label: 'Satin vert', amount: 85, category: 'Tissus', cosplayId: 'jupiter', pieceId: 'p-corsage', date: d(-9), paid: true },
      { id: 'e2', label: 'Doublure', amount: 40, category: 'Tissus', cosplayId: 'jupiter', pieceId: null, date: d(-9), paid: true },
      { id: 'e3', label: 'Tulle', amount: 60, category: 'Tissus', cosplayId: 'jupiter', pieceId: null, date: d(-7), paid: true },
      { id: 'e4', label: 'Gants blancs', amount: 32, category: 'Accessoires', cosplayId: 'jupiter', pieceId: 'p-gants', date: d(-6), paid: true },
      { id: 'e5', label: 'Broche', amount: 20, category: 'Accessoires', cosplayId: 'jupiter', pieceId: null, date: d(-5), paid: true },
      { id: 'e6', label: 'Mousse EVA', amount: 52, category: 'Accessoires', cosplayId: 'jinx', pieceId: null, date: d(0), paid: false },
      { id: 'e7', label: 'Perruque bleue', amount: 48, category: 'Perruque', cosplayId: 'jinx', pieceId: null, date: d(-4), paid: true },
      { id: 'e8', label: 'Bottes', amount: 25, category: 'Chaussures', cosplayId: 'jupiter', pieceId: 'p-bottes', date: d(-3), paid: true },
      { id: 'e9', label: 'Lentilles', amount: 50, category: 'Maquillage', cosplayId: 'jinx', pieceId: null, date: d(-2), paid: true },
    ],
    time: [...time, ...extra.time],
    events: [
      { id: 'v1', name: 'Japan Expo', city: 'Paris', date: d(42), cosplayId: 'jupiter' },
      { id: 'v2', name: 'Made in Asia', city: 'Bruxelles', date: d(110), cosplayId: 'jinx' },
      { id: 'v3', name: 'Paris Manga', city: 'Paris', date: d(-30), cosplayId: 'marin' },
      { id: 'v4', name: 'Shooting forêt', city: 'Fontainebleau', date: d(18), cosplayId: 'howl' },
    ],
  }
}
