export type DateTimeInput = string | number | Date | null | undefined

type FormatOptions = {
  withSeconds?: boolean
}

const dtfCache = new Map<string, Intl.DateTimeFormat>()

function getFormatter(withSeconds: boolean) {
  const key = withSeconds ? 'sec' : 'min'
  const cached = dtfCache.get(key)
  if (cached) return cached
  const formatter = new Intl.DateTimeFormat('zh-CN', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: withSeconds ? '2-digit' : undefined,
    hour12: false,
  })
  dtfCache.set(key, formatter)
  return formatter
}

function partsToMap(parts: Intl.DateTimeFormatPart[]) {
  const map: Record<string, string> = {}
  for (const p of parts) {
    if (p.type !== 'literal') map[p.type] = p.value
  }
  return map
}

export function formatDateTime(input: DateTimeInput, options: FormatOptions = {}): string {
  if (!input) return ''
  if (typeof input === 'string') {
    const s = input.trim()
    if (!s) return ''
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s
  }

  const d = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(d.getTime())) return ''

  const withSeconds = options.withSeconds === true
  const formatter = getFormatter(withSeconds)
  const map = partsToMap(formatter.formatToParts(d))

  const y = map.year
  const m = map.month
  const day = map.day
  const hh = map.hour
  const mm = map.minute
  const ss = map.second

  return withSeconds ? `${y}-${m}-${day} ${hh}:${mm}:${ss}` : `${y}-${m}-${day} ${hh}:${mm}`
}

