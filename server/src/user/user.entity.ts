import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude } from 'class-transformer';

export enum UserRole {
  OPERATOR = 1,
  QUALITY = 2,
  WAREHOUSE = 3,
  ADMIN = 4,
}

@Entity('sys_user')
export class User {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'username', length: 50, unique: true })
  username: string;

  @Exclude()
  @Column({ name: 'password', length: 255 })
  password: string;

  @Column({ name: 'real_name', length: 50 })
  realName: string;

  @Column({ name: 'role_code', type: 'int', default: UserRole.OPERATOR })
  roleCode: number = UserRole.OPERATOR;

  @Column({ name: 'phone', type: 'nvarchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean = true;

  @Column({ name: 'login_attempts', type: 'int', default: 0 })
  loginAttempts: number = 0;

  @Column({ name: 'locked_until', type: 'datetime2', nullable: true })
  lockedUntil: Date | null = null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
