import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MaterialType {
  POSITIVE = 1,
  NEGATIVE = 2,
  ELECTROLYTE = 3,
  SEPARATOR = 4,
  SHELL_CAP = 5,
}

export enum MaterialStatus {
  QUALIFIED = 1,
  UNQUALIFIED = 2,
}

@Entity('material_warehouse')
export class MaterialWarehouse {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'batch_no', length: 16 })
  batchNo: string;

  @Column({ name: 'material_type', type: 'tinyint' })
  materialType: number;

  @Column({ name: 'supplier_batch_no', length: 32 })
  supplierBatchNo: string;

  @Column({ name: 'status', type: 'tinyint', default: MaterialStatus.QUALIFIED })
  status: number = MaterialStatus.QUALIFIED;

  @Column({ name: 'warehouse_person', length: 32, nullable: true })
  warehousePerson: string;

  @Column({ name: 'quantity', type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ name: 'unit', length: 16, default: 'kg' })
  unit: string = 'kg';

  @Column({ name: 'created_by', type: 'int' })
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date | null;
}
