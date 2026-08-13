import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('sys_config')
export class SystemConfig {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: '[key]', nullable: true })
  key: string;

  @Column({ name: '[value]', type: 'nvarchar', length: 'max' })
  value: string;

  @Column({ name: 'description', type: 'nvarchar', length: 500, nullable: true })
  description: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
