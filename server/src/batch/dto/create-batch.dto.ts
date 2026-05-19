import { IsString, IsOptional, IsInt, Min, IsDateString, MaxLength } from 'class-validator';

export class CreateBatchDto {
  @IsOptional()
  @IsString()
  batchNo?: string;

  @IsString()
  @MaxLength(128)
  productModel: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  productSpec?: string;

  @IsString()
  @MaxLength(64)
  workshop: string;

  @IsString()
  @MaxLength(32)
  shift: string;

  @IsInt()
  @Min(1)
  plannedQty: number;

  @IsDateString()
  actualStartDate: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  remarks?: string;
}
