import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('sys_equipment')
export class Equipment {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'equipment_code', length: 50, unique: true })
  equipmentCode: string;

  @Column({ name: 'equipment_name', length: 100 })
  equipmentName: string;

  @Column({ name: 'model', type: 'nvarchar', length: 50, nullable: true })
  model: string | null;

  @Column({ name: 'department_code', type: 'nvarchar', length: 50, nullable: true })
  departmentCode: string | null;

  @Column({ name: 'is_active', default: true })
  isActive: boolean = true;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
