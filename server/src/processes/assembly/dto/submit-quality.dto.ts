import { IsString, MaxLength, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class SubmitAssemblyQualityDto {
  @IsString()
  @MaxLength(16)
  batchNo: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  bottomWeldPull: number;

  @IsString()
  @MaxLength(256)
  grooveRecord: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  capWeldingPull: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  tabWeldingPull: number;
}
