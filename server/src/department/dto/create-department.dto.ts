import { IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateDepartmentDto {
  @IsString()
  @IsNotEmpty({ message: '部门名称不能为空' })
  @Length(1, 100)
  name: string;

  @IsString()
  @IsNotEmpty({ message: '部门编码不能为空' })
  @Length(1, 20)
  code: string;
}
