import { IsString, IsOptional, IsInt, Min, IsDateString, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class UpdateBatchDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  productModel?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  productSpec?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  workshop?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  shift?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  plannedQty?: number;

  @IsOptional()
  @IsDateString()
  actualStartDate?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  status?: number;
}
