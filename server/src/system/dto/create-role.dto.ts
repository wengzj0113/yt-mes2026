import { IsInt, IsOptional, IsString, Length, Max, MaxLength, Min } from 'class-validator';

export class CreateRoleDto {
  @IsInt()
  @Min(5)
  @Max(2147483647)
  code: number;

  @IsString()
  @Length(1, 64)
  name: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  description?: string;
}