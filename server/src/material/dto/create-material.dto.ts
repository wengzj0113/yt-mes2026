import { IsString, IsOptional, MaxLength, IsNumber, Min, Max, IsIn } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateMaterialDto {
  @IsOptional() @IsString() @MaxLength(16) batchNo?: string;
  @Type(() => Number) @IsNumber() @Min(1) @Max(5) materialType: number;
  @IsString() @MaxLength(32) supplierBatchNo: string;
  @IsString() @MaxLength(32) warehousePerson: string;
  @IsOptional() @Type(() => Number) @IsNumber() @IsIn([1, 2]) status?: number;
  @Type(() => Number) @IsNumber() @Min(0.001) quantity: number;
  @IsOptional() @IsString() @MaxLength(16) unit?: string;
}
