import { ManualOverride } from '../entities/shop.entity';

export type DayKey =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday';

export interface DaySchedule {
  open: string;
  close: string;
  isOpen: boolean;
}

export type OperatingHours = Record<DayKey, DaySchedule>;

export interface ShopHoursStatus {
  isCurrentlyOpen: boolean;
  statusMessage: string;
  manualOverride: ManualOverride;
}
