import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sys_log')
export class SystemLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'user_id' })
  userId: number;

  @Column()
  username: string;

  @Column()
  action: string;

  @Column()
  module: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true })
  detail: string;

  @Column({ nullable: true })
  ip: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
