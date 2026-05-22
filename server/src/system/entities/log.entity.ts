import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sys_log')
export class SystemLog {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column({ name: 'username' })
  username: string;

  @Column({ name: 'action' })
  action: string;

  @Column({ name: 'module' })
  module: string;

  @Column({ name: 'detail', type: 'nvarchar', length: 'max', nullable: true })
  detail: string;

  @Column({ name: 'ip', nullable: true })
  ip: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
