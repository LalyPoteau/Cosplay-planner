import { useStore } from '../data/useStore'

/** Select a cosplay (or none). */
export function CosplaySelect({ value, onChange, className = 'field' }: { value: string | null; onChange: (id: string | null) => void; className?: string }) {
  const { state } = useStore()
  return (
    <select className={className} value={value ?? ''} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">— Aucun —</option>
      {state.cosplays.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  )
}
