export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 36e5
}

export function waitLabel(iso: string): string {
  const h = hoursSince(iso)
  if (h < 1) return 'меньше часа'
  if (h < 24) return `${Math.floor(h)} ч`
  return `${Math.floor(h / 24)} д`
}
