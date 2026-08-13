export function formatKValue(value: number | null | undefined): string {
  return value === null || value === undefined || Number.isNaN(Number(value))
    ? '-'
    : Number(value).toFixed(4)
}
