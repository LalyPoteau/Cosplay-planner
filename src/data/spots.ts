// Places on the mannequin where a piece can sit. Coordinates are on the 518×594 mannequin area
// (silhouette from the Figma mock-up); `cy` is where the label sits, `side` which side of the body.

export type SpotId =
  | 'tete-haut' | 'cheveux' | 'visage' | 'oreilles'
  | 'cou' | 'epaule-g' | 'epaule-d' | 'col' | 'poitrine' | 'taille'
  | 'bras-g' | 'bras-d' | 'main-g' | 'main-d'
  | 'jupe' | 'jambes' | 'ourlet' | 'pieds'

export type Spot = { id: SpotId; group: string; label: string; x: number; y: number; cy: number; side: 'left' | 'right' }

export const SPOTS: Spot[] = [
  { id: 'tete-haut', group: 'Tête', label: 'Haut de tête', x: 260, y: 44, cy: 44, side: 'right' },
  { id: 'cheveux', group: 'Tête', label: 'Cheveux / perruque', x: 284, y: 68, cy: 76, side: 'right' },
  { id: 'oreilles', group: 'Tête', label: 'Oreilles', x: 235, y: 76, cy: 76, side: 'left' },
  { id: 'visage', group: 'Tête', label: 'Visage / maquillage', x: 252, y: 94, cy: 108, side: 'left' },
  { id: 'cou', group: 'Haut du corps', label: 'Cou', x: 260, y: 126, cy: 140, side: 'left' },
  { id: 'epaule-d', group: 'Haut du corps', label: 'Épaule droite', x: 306, y: 150, cy: 140, side: 'right' },
  { id: 'epaule-g', group: 'Haut du corps', label: 'Épaule gauche', x: 214, y: 150, cy: 172, side: 'left' },
  { id: 'col', group: 'Haut du corps', label: 'Col / nœud', x: 260, y: 162, cy: 172, side: 'right' },
  { id: 'poitrine', group: 'Haut du corps', label: 'Buste', x: 260, y: 214, cy: 204, side: 'right' },
  { id: 'taille', group: 'Haut du corps', label: 'Taille / ceinture', x: 260, y: 280, cy: 288, side: 'right' },
  { id: 'bras-g', group: 'Bras & mains', label: 'Bras gauche', x: 192, y: 240, cy: 240, side: 'left' },
  { id: 'bras-d', group: 'Bras & mains', label: 'Bras droit', x: 328, y: 240, cy: 246, side: 'right' },
  { id: 'main-g', group: 'Bras & mains', label: 'Main gauche', x: 185, y: 322, cy: 322, side: 'left' },
  { id: 'main-d', group: 'Bras & mains', label: 'Main droite', x: 335, y: 322, cy: 330, side: 'right' },
  { id: 'jupe', group: 'Bas du corps', label: 'Jupe / bassin', x: 260, y: 400, cy: 400, side: 'right' },
  { id: 'jambes', group: 'Bas du corps', label: 'Jambes', x: 244, y: 466, cy: 466, side: 'left' },
  { id: 'ourlet', group: 'Bas du corps', label: 'Ourlet / traîne', x: 306, y: 500, cy: 500, side: 'right' },
  { id: 'pieds', group: 'Bas du corps', label: 'Pieds', x: 240, y: 536, cy: 536, side: 'left' },
]

export const spotById = (id: SpotId) => SPOTS.find((s) => s.id === id)!
export const SPOT_GROUPS = [...new Set(SPOTS.map((s) => s.group))]
