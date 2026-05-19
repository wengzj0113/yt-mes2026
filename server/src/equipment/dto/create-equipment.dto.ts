import { IsString, IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateEquipmentDto {
  @IsString()
  @IsNotEmpty({ message: '设备编码不能为空' })
  @Length(1, 20)
  equipmentCode: string;

  @IsString()
  @IsNotEmpty({ message: '设备名称不能为空' })
  @Length(1, 100)
  equipmentName: string;

  @IsString()
  @IsOptional()
  model?: string;

  @IsString()
  @IsOptional()
  departmentCode?: string;
}
