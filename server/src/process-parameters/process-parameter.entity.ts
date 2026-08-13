import { Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('process_parameter')
@Index(['batchNo', 'processCode'], { unique: true })
export class ProcessParameter {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'batch_no', length: 16 })
  batchNo: string;

  @Column({ name: 'process_code', length: 16 })
  processCode: string;

  @Column({ name: 'equipment_code', length: 64 })
  equipmentCode: string;

  @Column({ name: 'ocv_voltage_min', type: 'decimal', precision: 12, scale: 4 })
  ocvVoltageMin: number;

  @Column({ name: 'ocv_voltage_max', type: 'decimal', precision: 12, scale: 4 })
  ocvVoltageMax: number;

  @Column({ name: 'ir_min', type: 'decimal', precision: 12, scale: 4 })
  irMin: number;

  @Column({ name: 'ir_max', type: 'decimal', precision: 12, scale: 4 })
  irMax: number;

  @Column({ name: 'capacity_min', type: 'decimal', precision: 12, scale: 4 })
  capacityMin: number;

  @Column({ name: 'capacity_max', type: 'decimal', precision: 12, scale: 4 })
  capacityMax: number;

  @Column({ name: 'operator_name', length: 64 })
  operatorName: string;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
