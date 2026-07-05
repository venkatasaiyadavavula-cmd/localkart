import { Shop, ManualOverride } from '../entities/shop.entity';
import { DayKey, DaySchedule, OperatingHours, ShopHoursStatus } from '../types/shop-hours.types';

const DAY_KEYS: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

const JS_DAY_TO_KEY: DayKey[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
];

export function createDefaultOperatingHours(): OperatingHours {
  const weekday: DaySchedule = { open: '09:00', close: '21:00', isOpen: true };
  const sunday: DaySchedule = { open: '09:00', close: '21:00', isOpen: false };
  return {
    monday: { ...weekday },
    tuesday: { ...weekday },
    wednesday: { ...weekday },
    thursday: { ...weekday },
    friday: { ...weekday },
    saturday: { ...weekday },
    sunday: { ...sunday },
  };
}

function normalizeTime(value?: string | null): string {
  if (!value) return '00:00';
  return value.slice(0, 5);
}

function timeToMinutes(value: string): number {
  const [h, m] = normalizeTime(value).split(':').map(Number);
  return h * 60 + m;
}

function formatTime12h(value: string): string {
  const [h, m] = normalizeTime(value).split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

function getNowInIST(): Date {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
}

function getTodaySchedule(shop: Shop): DaySchedule | null {
  const hours = shop.operatingHours as OperatingHours | null;
  if (!hours) {
    if (shop.openingTime && shop.closingTime) {
      return {
        open: normalizeTime(shop.openingTime),
        close: normalizeTime(shop.closingTime),
        isOpen: true,
      };
    }
    return null;
  }
  const now = getNowInIST();
  const dayKey = JS_DAY_TO_KEY[now.getDay()];
  return hours[dayKey] ?? null;
}

function isWithinSchedule(shop: Shop): boolean {
  const schedule = getTodaySchedule(shop);
  if (!schedule || !schedule.isOpen) return false;

  const now = getNowInIST();
  const current = now.getHours() * 60 + now.getMinutes();
  const open = timeToMinutes(schedule.open);
  const close = timeToMinutes(schedule.close);

  if (open <= close) {
    return current >= open && current <= close;
  }
  // overnight hours (e.g. 22:00 - 02:00)
  return current >= open || current <= close;
}

export function isShopCurrentlyOpen(shop: Shop): boolean {
  const override = shop.manualOverride ?? ManualOverride.FORCE_CLOSED;

  if (override === ManualOverride.FORCE_CLOSED) return false;
  if (override === ManualOverride.FORCE_OPEN) return true;
  return isWithinSchedule(shop);
}

export function getShopHoursStatus(shop: Shop): ShopHoursStatus {
  const override = shop.manualOverride ?? ManualOverride.FORCE_CLOSED;
  const isCurrentlyOpen = isShopCurrentlyOpen(shop);
  const schedule = getTodaySchedule(shop);

  let statusMessage: string;

  if (override === ManualOverride.FORCE_CLOSED) {
    statusMessage = 'Manually closed — tap to reopen';
  } else if (override === ManualOverride.FORCE_OPEN) {
    statusMessage = 'Open now (manual override)';
  } else if (isCurrentlyOpen && schedule) {
    statusMessage = `Open until ${formatTime12h(schedule.close)}`;
  } else if (schedule?.isOpen) {
    statusMessage = `Closed — opens at ${formatTime12h(schedule.open)}`;
  } else {
    statusMessage = 'Closed today';
  }

  return {
    isCurrentlyOpen,
    statusMessage,
    manualOverride: override,
  };
}

export function enrichShopWithHoursStatus<T extends Shop>(shop: T): T & ShopHoursStatus {
  const status = getShopHoursStatus(shop);
  return {
    ...shop,
    ...status,
  };
}

export function enrichProductWithShopHours<T extends { shop?: Shop | null }>(product: T): T {
  if (!product.shop) return product;
  return {
    ...product,
    shop: enrichShopWithHoursStatus(product.shop),
  };
}

export function enrichProductsWithShopHours<T extends { shop?: Shop | null }>(products: T[]): T[] {
  return products.map(enrichProductWithShopHours);
}

export function migrateLegacyHoursToOperatingHours(shop: Shop): OperatingHours {
  const defaults = createDefaultOperatingHours();
  if (shop.operatingHours) {
    return shop.operatingHours as OperatingHours;
  }
  if (shop.openingTime && shop.closingTime) {
    const schedule: DaySchedule = {
      open: normalizeTime(shop.openingTime),
      close: normalizeTime(shop.closingTime),
      isOpen: true,
    };
    for (const key of DAY_KEYS) {
      if (key !== 'sunday') {
        defaults[key] = { ...schedule };
      }
    }
    defaults.sunday = { ...schedule, isOpen: false };
  }
  return defaults;
}
