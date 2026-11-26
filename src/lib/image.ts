/** Reads an image file as a data URL, shrunk to at most `maxSide` px (keeps local data light). */
export async function fileToDataUrl(file: File, maxSide: number): Promise<string> {
  const raw = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
  if (file.type === 'image/svg+xml' || file.type === 'image/gif') return raw
  const img = new Image()
  img.src = raw
  await img.decode()
  const scale = Math.min(1, maxSide / Math.max(img.width, img.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.round(img.width * scale)
  canvas.height = Math.round(img.height * scale)
  canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
  return canvas.toDataURL('image/webp', 0.88)
}

export const imageFiles = (files: FileList | File[] | null | undefined) =>
  [...(files ?? [])].filter((f) => f.type.startsWith('image/'))
