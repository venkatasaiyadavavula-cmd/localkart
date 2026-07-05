import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsObject,
  IsOptional,
  IsString,
  Matches,
  ValidateNested,
} from 'class-validator';

class DayScheduleDto {
  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  open: string;

  @IsString()
  @Matches(/^([01]\d|2[0-3]):([0-5]\d)$/)
  close: string;

  @IsBoolean()
  isOpen: boolean;
}

export class UpdateShopHoursDto {
  @IsObject()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  monday: DayScheduleDto;

  @IsObject()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  tuesday: DayScheduleDto;

  @IsObject()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  wednesday: DayScheduleDto;

  @IsObject()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  thursday: DayScheduleDto;

  @IsObject()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  friday: DayScheduleDto;

  @IsObject()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  saturday: DayScheduleDto;

  @IsObject()
  @ValidateNested()
  @Type(() => DayScheduleDto)
  sunday: DayScheduleDto;
}
