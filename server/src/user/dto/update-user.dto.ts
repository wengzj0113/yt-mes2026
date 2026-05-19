import { IsString, IsOptional, IsNumber, IsBoolean } from 'class-validator';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  realName?: string;

  @IsNumber()
  @IsOptional()
  roleCode?: number;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
