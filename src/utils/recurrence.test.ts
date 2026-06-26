import { describe, it, expect } from 'vitest';
import { getRecurringDates } from '../utils/recurrence';

describe('getRecurringDates', () => {
  it('returns single date for none recurrence', () => {
    const dates = getRecurringDates('2026-06-01', 'none', 1);
    expect(dates).toEqual(['2026-06-01']);
  });

  it('returns weekly dates', () => {
    const dates = getRecurringDates('2026-06-01', 'weekly', 3);
    expect(dates).toEqual(['2026-06-01', '2026-06-08', '2026-06-15']);
  });

  it('returns biweekly dates', () => {
    const dates = getRecurringDates('2026-06-01', 'biweekly', 2);
    expect(dates).toEqual(['2026-06-01', '2026-06-15']);
  });

  it('returns monthly dates', () => {
    const dates = getRecurringDates('2026-06-01', 'monthly', 3);
    expect(dates).toEqual(['2026-06-01', '2026-07-01', '2026-08-01']);
  });
});
