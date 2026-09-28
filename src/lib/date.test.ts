import { describe, expect, it } from 'vitest';
import { farmDate } from './date';

describe('farm date', () => {
  it('uses the farm timezone before UTC midnight', () => {
    expect(farmDate(new Date('2026-09-27T16:59:00Z'))).toBe('2026-09-27');
  });

  it('moves to the next date at midnight in Bangkok', () => {
    expect(farmDate(new Date('2026-09-27T17:00:00Z'))).toBe('2026-09-28');
  });
});
