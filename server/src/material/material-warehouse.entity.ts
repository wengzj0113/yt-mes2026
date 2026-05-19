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
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 16 })
  batchNo: string;

  @Column({ type: 'tinyint' })
  materialType: number;

  @Column({ length: 32 })
  supplierBatchNo: string;

  @Column({ type: 'tinyint', default: MaterialStatus.QUALIFIED })
  status: number = MaterialStatus.QUALIFIED;

  @Column({ length: 32, nullable: true })
  warehousePerson: string;

  @Column({ type: 'decimal', precision: 12, scale: 3 })
  quantity: number;

  @Column({ length: 16, default: 'kg' })
  unit: string = 'kg';

  @Column({ type: 'int' })
  createdBy: number;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'int', nullable: true })
  updatedBy: number | null;

  @UpdateDateColumn()
  updatedAt: Date | null;
}
