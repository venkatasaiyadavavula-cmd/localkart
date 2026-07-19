const IST_TIMEZONE = 'Asia/Kolkata';

function toDate(value: string | Date): Date {
  return typeof value === 'string' ? new Date(value) : value;
}

/** Parse YYYY-MM-DD (or ISO prefix) as noon UTC so IST calendar day stays stable. */
export function parseDateOnlyInIst(dateStr: string): Date {
  const [year, month, day] = dateStr.split('T')[0].split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(toDate(date));
}

export function formatDateTime(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(toDate(date));
}

/** Short date for lists, e.g. "19 Jul". */
export function formatDateShort(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
  }).format(toDate(date));
}

/** Weekday + short date in IST, e.g. "Sat, 19 Jul". */
export function formatDateWeekday(date: string | Date): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(toDate(date));
}

/** Date-only API fields (billDate, weekStartDate) — avoids UTC midnight day shift. */
export function formatCalendarDate(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: 'numeric',
    month: 'short',
  }).format(parseDateOnlyInIst(dateStr));
}

export function formatCalendarDateWeekday(dateStr: string): string {
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(parseDateOnlyInIst(dateStr));
}

/** Order list row date, e.g. "19 Jul 2026". */
export function formatOrderListDate(date: string | Date): string {
  return formatDate(date);
}

/** Seller/staff order row, e.g. "19 Jul · 02:30 pm". */
export function formatOrderDateTime(date: string | Date): string {
  const d = toDate(date);
  const datePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${datePart} · ${timePart}`;
}

/** Order detail header, e.g. "19 Jul 2026, 02:30 pm". */
export function formatOrderDetailDateTime(date: string | Date): string {
  const d = toDate(date);
  const datePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(d);
  return `${datePart}, ${timePart}`;
}

export function timeAgo(date: string | Date): string {
  const now = new Date();
  const past = toDate(date);
  const diffMs = now.getTime() - past.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  if (diffHours < 24) return `${diffHours} hr ago`;
  if (diffDays < 7) return `${diffDays} days ago`;
  return formatDate(date);
}
