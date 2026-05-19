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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  username: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @Column({ length: 50 })
  realName: string;

  @Column({ type: 'int', default: UserRole.OPERATOR })
  roleCode: number = UserRole.OPERATOR;

  @Column({ type: 'nvarchar', length: 20, nullable: true })
  phone: string | null;

  @Column({ default: true })
  isActive: boolean = true;

  @Column({ type: 'int', default: 0 })
  loginAttempts: number = 0;

  @Column({ type: 'datetime2', nullable: true })
  lockedUntil: Date | null = null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
