import { describe, expect, it } from 'vitest';
import { harvestInput, hiveInput, inspectionInput } from './validation';

describe('API input validation', () => {
  it('normalizes hive codes', () => {
    expect(hiveInput.parse({ code: 'mf-001', name: 'รังสวนหน้า', status: 'Normal' }).code).toBe('MF-001');
  });

  it('rejects negative harvest amounts', () => {
    expect(harvestInput.safeParse({ hiveId: crypto.randomUUID(), harvestedAt: '2026-09-28', honeyMl: -1, propolisG: 0 }).success).toBe(false);
  });

  it('rejects impossible dates', () => {
    expect(inspectionInput.safeParse({ hiveId: crypto.randomUUID(), inspectedAt: '2026-02-30', status: 'Strong' }).success).toBe(false);
  });
});
