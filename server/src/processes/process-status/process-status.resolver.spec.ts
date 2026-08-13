import { resolveProcessStatus } from './process-status.resolver';

describe('resolveProcessStatus', () => {
  it('labels a saved draft record as saved', () => {
    expect(resolveProcessStatus({ isDraft: true, recordStatus: 1 }, null, null).status).toBe('saved');
  });

  it('labels saved OCV parameters as saved even without an OCV upload record', () => {
    const result = resolveProcessStatus(null, { updatedAt: new Date('2026-08-06T01:00:00Z') }, null);
    expect(result.status).toBe('saved');
    expect(result.updatedAt).toBe('2026-08-06T01:00:00.000Z');
  });
});
