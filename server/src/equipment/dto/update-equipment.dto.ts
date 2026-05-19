import { IsString, IsOptional, IsBoolean, Length } from 'class-validator';

export class UpdateEquipmentDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  equipmentName?: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  departmentCode?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
