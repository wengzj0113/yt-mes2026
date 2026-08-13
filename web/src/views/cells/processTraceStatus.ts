export type TraceProcessStatus = 'not_entered' | 'saved' | 'submitted' | 'voided'

export function resolveTraceProcessStatus(record: {
  isDraft?: boolean | null
  recordStatus?: number | null
} | null | undefined): TraceProcessStatus {
  if (!record) return 'not_entered'
  if (record.recordStatus === 2) return 'voided'
  if (record.isDraft === true) return 'saved'
  return 'submitted'
}
