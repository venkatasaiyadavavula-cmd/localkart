export type DashboardPeriod = 'week' | 'month' | 'year';

export interface DateRange {
  start: Date;
  end: Date;
}

export interface PeriodRanges {
  current: DateRange;
  previous: DateRange;
}

const PERIOD_DAYS: Record<DashboardPeriod, number> = {
  week: 7,
  month: 30,
  year: 365,
};

/** Rolling window: current = [now - N days, now], previous = [now - 2N days, now - N days). */
export function getPeriodRanges(
  period: DashboardPeriod,
  now: Date = new Date(),
): PeriodRanges {
  const days = PERIOD_DAYS[period];
  const msPerDay = 24 * 60 * 60 * 1000;

  const currentEnd = now;
  const currentStart = new Date(now.getTime() - days * msPerDay);
  const previousEnd = currentStart;
  const previousStart = new Date(currentStart.getTime() - days * msPerDay);

  return {
    current: { start: currentStart, end: currentEnd },
    previous: { start: previousStart, end: previousEnd },
  };
}

/** Percent change from previous to current; 0 when both are zero. */
export function calculateTrendPercent(current: number, previous: number): number {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }
  return Math.round(((current - previous) / previous) * 1000) / 10;
}

export function normalizeDashboardPeriod(period?: string): DashboardPeriod {
  if (period === 'week' || period === 'month' || period === 'year') {
    return period;
  }
  return 'month';
}
