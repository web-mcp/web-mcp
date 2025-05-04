export function formatDuration(d: number) {
  const totalSeconds = d / 1000

  const h = Math.floor(totalSeconds / 3600)
  const m = Math.floor((totalSeconds % 3600) / 60)
  const s = "" + Math.floor(totalSeconds % 60)

  let result = s.padStart(2, "0")
  if (m > 0 || h > 0) result = `${m}:${result}`
  if (h > 0) result = `${h}:${result}`
  return result
}
