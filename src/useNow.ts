import { useEffect, useState } from 'react'

/** Current timestamp, refreshed every `intervalMs` (pass null to stop ticking). */
export function useNow(intervalMs: number | null) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    if (intervalMs === null) return
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
