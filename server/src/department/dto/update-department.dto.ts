import { IsString, IsOptional, Length, IsBoolean } from 'class-validator';

export class UpdateDepartmentDto {
  @IsString()
  @IsOptional()
  @Length(1, 100)
  name?: string;

  @IsString()
  @IsOptional()
  @Length(1, 20)
  code?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
