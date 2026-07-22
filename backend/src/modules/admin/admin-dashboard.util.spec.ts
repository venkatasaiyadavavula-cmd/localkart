import {
  calculateTrendPercent,
  getPeriodRanges,
  normalizeDashboardPeriod,
} from './admin-dashboard.util';

describe('admin-dashboard.util', () => {
  const fixedNow = new Date('2026-07-22T12:00:00.000Z');

  describe('getPeriodRanges', () => {
    it('returns non-overlapping week windows', () => {
      const { current, previous } = getPeriodRanges('week', fixedNow);
      const weekMs = 7 * 24 * 60 * 60 * 1000;

      expect(current.end).toEqual(fixedNow);
      expect(current.start.getTime()).toBe(fixedNow.getTime() - weekMs);
      expect(previous.end).toEqual(current.start);
      expect(previous.start.getTime()).toBe(current.start.getTime() - weekMs);
    });

    it('uses 30-day month and 365-day year windows', () => {
      const month = getPeriodRanges('month', fixedNow);
      const year = getPeriodRanges('year', fixedNow);

      expect(month.current.start.getTime()).toBe(
        fixedNow.getTime() - 30 * 24 * 60 * 60 * 1000,
      );
      expect(year.current.start.getTime()).toBe(
        fixedNow.getTime() - 365 * 24 * 60 * 60 * 1000,
      );
    });
  });

  describe('calculateTrendPercent', () => {
    it('returns 0 when both periods are zero', () => {
      expect(calculateTrendPercent(0, 0)).toBe(0);
    });

    it('returns 100 when previous is zero and current is positive', () => {
      expect(calculateTrendPercent(50, 0)).toBe(100);
    });

    it('calculates positive and negative percentage change', () => {
      expect(calculateTrendPercent(150, 100)).toBe(50);
      expect(calculateTrendPercent(75, 100)).toBe(-25);
    });

    it('rounds to one decimal place', () => {
      expect(calculateTrendPercent(133, 100)).toBe(33);
      expect(calculateTrendPercent(1, 3)).toBe(-66.7);
    });
  });

  describe('normalizeDashboardPeriod', () => {
    it('accepts valid periods and defaults invalid values to month', () => {
      expect(normalizeDashboardPeriod('week')).toBe('week');
      expect(normalizeDashboardPeriod('month')).toBe('month');
      expect(normalizeDashboardPeriod('year')).toBe('year');
      expect(normalizeDashboardPeriod('quarter')).toBe('month');
      expect(normalizeDashboardPeriod(undefined)).toBe('month');
    });
  });
});
