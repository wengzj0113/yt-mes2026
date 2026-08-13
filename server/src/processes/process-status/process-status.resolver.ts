export type ResolvedProcessStatus = 'not_entered' | 'saved' | 'pending_quality' | 'quality_passed' | 'quality_failed' | 'voided';

export interface StatusResolution {
  status: ResolvedProcessStatus;
  isDraft: boolean | null;
  recordStatus: number | null;
  updatedAt: string | null;
}

function toIso(value: Date | string | null | undefined): string | null {
  return value ? new Date(value).toISOString() : null;
}

export function resolveProcessStatus(
  record: { isDraft?: boolean; recordStatus?: number; updatedAt?: Date | string | null } | null,
  parameter: { updatedAt?: Date | string | null } | null,
  quality: { hasFailed: boolean } | null,
): StatusResolution {
  if (parameter) {
    return { status: 'saved', isDraft: false, recordStatus: 1, updatedAt: toIso(parameter.updatedAt) };
  }
  if (!record) {
    return { status: 'not_entered', isDraft: null, recordStatus: null, updatedAt: null };
  }
  if (record.recordStatus === 2) {
    return { status: 'voided', isDraft: record.isDraft ?? null, recordStatus: 2, updatedAt: toIso(record.updatedAt) };
  }
  if (record.isDraft) {
    return { status: 'saved', isDraft: true, recordStatus: record.recordStatus ?? null, updatedAt: toIso(record.updatedAt) };
  }
  return {
    status: quality ? (quality.hasFailed ? 'quality_failed' : 'quality_passed') : 'pending_quality',
    isDraft: false,
    recordStatus: record.recordStatus ?? null,
    updatedAt: toIso(record.updatedAt),
  };
}
