import { Entity, PrimaryGeneratedColumn, Column, UpdateDateColumn } from 'typeorm';

@Entity('sys_config')
export class SystemConfig {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  key: string;

  @Column({ type: 'nvarchar', length: 'max' })
  value: string;

  @Column({ type: 'nvarchar', length: 500, nullable: true })
  description: string;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
