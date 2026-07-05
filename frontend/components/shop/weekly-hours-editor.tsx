'use client';

import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  DAY_LABELS,
  type DayKey,
  type OperatingHours,
} from '@/types/shop-hours';

interface WeeklyHoursEditorProps {
  value: OperatingHours;
  onChange: (hours: OperatingHours) => void;
}

export function WeeklyHoursEditor({ value, onChange }: WeeklyHoursEditorProps) {
  const updateDay = (day: DayKey, patch: Partial<OperatingHours[DayKey]>) => {
    onChange({
      ...value,
      [day]: { ...value[day], ...patch },
    });
  };

  return (
    <div className="space-y-3">
      {DAY_LABELS.map(({ key, label }) => {
        const schedule = value[key];
        return (
          <div
            key={key}
            className="flex flex-col gap-3 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="flex items-center justify-between gap-3 sm:min-w-[140px]">
              <Label className="font-medium">{label}</Label>
              <div className="flex items-center gap-2 sm:hidden">
                <span className="text-xs text-muted-foreground">Open</span>
                <Switch
                  checked={schedule.isOpen}
                  onCheckedChange={(checked) => updateDay(key, { isOpen: checked })}
                />
              </div>
            </div>

            {schedule.isOpen ? (
              <div className="flex flex-1 items-center gap-2">
                <Input
                  type="time"
                  value={schedule.open}
                  onChange={(e) => updateDay(key, { open: e.target.value })}
                  className="w-full sm:w-32"
                />
                <span className="text-sm text-muted-foreground">to</span>
                <Input
                  type="time"
                  value={schedule.close}
                  onChange={(e) => updateDay(key, { close: e.target.value })}
                  className="w-full sm:w-32"
                />
              </div>
            ) : (
              <p className="flex-1 text-sm text-muted-foreground">Closed all day</p>
            )}

            <div className="hidden items-center gap-2 sm:flex">
              <span className="text-xs text-muted-foreground whitespace-nowrap">Open</span>
              <Switch
                checked={schedule.isOpen}
                onCheckedChange={(checked) => updateDay(key, { isOpen: checked })}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
