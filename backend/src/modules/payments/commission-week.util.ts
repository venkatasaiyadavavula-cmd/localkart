/** Sat–Fri commission week helpers (IST calendar dates as YYYY-MM-DD). */

const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

export function toIstDateString(date: Date = new Date()): string {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return ist.toISOString().slice(0, 10);
}

export function parseDateOnly(dateStr: string): Date {
  return new Date(`${dateStr}T00:00:00+05:30`);
}

/** Day of week in IST: 0=Sun … 6=Sat */
export function istDayOfWeek(date: Date = new Date()): number {
  const ist = new Date(date.getTime() + IST_OFFSET_MS);
  return ist.getUTCDay();
}

/** Friday (due date) for the Sat–Fri week containing `date`. */
export function getWeekEndingFriday(date: Date = new Date()): string {
  const istDate = toIstDateString(date);
  const d = parseDateOnly(istDate);
  const dow = istDayOfWeek(date);
  const daysUntilFriday = (5 - dow + 7) % 7;
  d.setDate(d.getDate() + daysUntilFriday);
  return toIstDateString(d);
}

/** Saturday starting the week that ends on `fridayDate`. */
export function getWeekStartSaturday(fridayDate: string): string {
  const d = parseDateOnly(fridayDate);
  d.setDate(d.getDate() - 6);
  return toIstDateString(d);
}

/** Inclusive IST range for delivered orders in a Sat–Fri week ending on `fridayDate`. */
export function getWeekOrderRange(fridayDate: string): { start: Date; end: Date } {
  const weekStart = getWeekStartSaturday(fridayDate);
  return {
    start: parseDateOnly(weekStart),
    end: new Date(`${fridayDate}T23:59:59.999+05:30`),
  };
}

/** Calendar days after Friday due date (0 on Friday, 1 on Saturday, …). */
export function daysOverdueFromFridayDue(fridayDate: string, today: Date = new Date()): number {
  const todayIst = toIstDateString(today);
  if (todayIst <= fridayDate) return 0;
  const start = parseDateOnly(fridayDate).getTime();
  const end = parseDateOnly(todayIst).getTime();
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

/** Map any daily billDate to its Sat–Fri week-ending Friday. */
export function fridayForBillDate(billDate: string): string {
  return getWeekEndingFriday(parseDateOnly(billDate));
}

export function formatWeekLabel(weekStartDate: string, billDate: string): string {
  const start = parseDateOnly(weekStartDate);
  const end = parseDateOnly(billDate);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', timeZone: 'Asia/Kolkata' });
  return `${fmt(start)} – ${fmt(end)}`;
}
