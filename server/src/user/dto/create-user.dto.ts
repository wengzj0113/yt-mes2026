import { IsString, IsNotEmpty, IsNumber, IsOptional, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty({ message: '用户名不能为空' })
  @Length(4, 50)
  username: string;

  @IsString()
  @IsNotEmpty({ message: '姓名不能为空' })
  realName: string;

  @IsString()
  @IsNotEmpty({ message: '密码不能为空' })
  @Length(6, 100)
  password: string;

  @IsNumber()
  @IsNotEmpty({ message: '角色不能为空' })
  roleCode: number;

  @IsString()
  @IsOptional()
  phone?: string;
}
