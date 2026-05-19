import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_equipment')
export class Equipment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50, unique: true })
  equipmentCode: string;

  @Column({ length: 100 })
  equipmentName: string;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  model: string | null;

  @Column({ type: 'nvarchar', length: 50, nullable: true })
  departmentCode: string | null;

  @Column({ default: true })
  isActive: boolean = true;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
