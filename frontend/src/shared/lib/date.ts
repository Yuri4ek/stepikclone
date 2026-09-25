export function hoursSince(iso: string): number {
  return (Date.now() - new Date(iso).getTime()) / 36e5
}

/** Сколько ждёт работа: «48 м», «2 ч 40 м», «1 д 3 ч» */
export function waitLabel(iso: string): string {
  const mins = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000))
  if (mins < 60) return `${mins} м`
  const h = Math.floor(mins / 60)
  if (h < 24) return `${h} ч ${mins % 60} м`
  return `${Math.floor(h / 24)} д ${h % 24} ч`
}

/** «сегодня», «вчера», «3 дня назад» */
export function relativeDay(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime()
  const days = Math.round((start(new Date()) - start(d)) / 864e5)
  if (days <= 0) return 'сегодня'
  if (days === 1) return 'вчера'
  const m10 = days % 10
  const m100 = days % 100
  const word = m10 === 1 && m100 !== 11 ? 'день' : m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? 'дня' : 'дней'
  return `${days} ${word} назад`
}
