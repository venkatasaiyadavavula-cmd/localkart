declare class DayScheduleDto {
    open: string;
    close: string;
    isOpen: boolean;
}
export declare class UpdateShopHoursDto {
    monday: DayScheduleDto;
    tuesday: DayScheduleDto;
    wednesday: DayScheduleDto;
    thursday: DayScheduleDto;
    friday: DayScheduleDto;
    saturday: DayScheduleDto;
    sunday: DayScheduleDto;
}
export {};
