import { useRef, useState, type DragEvent } from 'react'
import camera from '../assets/icons/camera-26.svg'
import { fileToDataUrl } from '../lib/image'

type Props = {
  icon: string | null
  name: string
  size?: number
  /** When given, the slot accepts a click / drop to pick an image */
  onChange?: (icon: string | null) => void
}

/** Square icon slot of a cosplay: its picture, or a camera placeholder. */
export default function CosplayIcon({ icon, name, size = 60, onChange }: Props) {
  const input = useRef<HTMLInputElement>(null)
  const [over, setOver] = useState(false)

  const pick = async (file: File | undefined) => {
    if (file && file.type.startsWith('image/') && onChange) onChange(await fileToDataUrl(file, 256))
  }
  const onDrop = (e: DragEvent) => {
    e.preventDefault()
    setOver(false)
    void pick(e.dataTransfer.files[0])
  }

  const frame = (
    <span
      className={`relative grid shrink-0 place-items-center overflow-hidden border bg-linear-[240deg] from-[#3a3fb0] from-13% to-[#0b1030] to-87% transition ${
        over ? 'border-cyan shadow-[0_0_12px_rgb(92_242_228/0.5)]' : 'border-glace/40'
      }`}
      style={{ width: size, height: size }}
    >
      {icon ? (
        <img src={icon} alt="" className="size-full object-cover" />
      ) : (
        <img src={camera} alt="" style={{ width: size * 0.43, height: size * 0.43 }} />
      )}
      {onChange && (
        <span className="absolute inset-x-0 bottom-0 bg-nuit/75 py-[2px] text-center text-[8px] tracking-[0.8px] text-cyan opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
          {icon ? 'CHANGER' : 'ICÔNE'}
        </span>
      )}
    </span>
  )

  if (!onChange) return frame

  return (
    <span className="relative inline-block">
      <button
        type="button"
        title="Choisir une icône (clic ou glisser une image)"
        aria-label={`Choisir l’icône de ${name}`}
        onClick={() => input.current?.click()}
        onDragOver={(e) => (e.preventDefault(), setOver(true))}
        onDragLeave={() => setOver(false)}
        onDrop={onDrop}
        className="group block cursor-pointer focus-visible:outline-1 focus-visible:outline-offset-2 focus-visible:outline-cyan"
      >
        {frame}
      </button>
      {icon && (
        <button
          type="button"
          aria-label="Retirer l’icône"
          onClick={() => onChange(null)}
          className="absolute -top-2 -right-2 grid size-4 cursor-pointer place-items-center rounded-full border border-glace/50 bg-nuit text-[8px] text-ardoise hover:text-glitch"
        >
          ✕
        </button>
      )}
      <input ref={input} type="file" accept="image/*" hidden onChange={(e) => void pick(e.target.files?.[0])} />
    </span>
  )
}
