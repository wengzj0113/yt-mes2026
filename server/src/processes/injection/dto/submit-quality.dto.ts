import { IsString, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitInjectionQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  injectionAmount: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  injectionHumidity: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  injectionTemperature: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  sealingDimension: number;

  @IsString()
  @MaxLength(256)
  cleaningRecord: string;
}
