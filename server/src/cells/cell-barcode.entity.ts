import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cell_barcode')
export class CellBarcode {
  @PrimaryGeneratedColumn({ name: 'id' }) 
  id: number;

  @Column({ name: 'barcode', length: 32, unique: true }) 
  barcode: string;

  @Column({ name: 'batch_no', length: 16 }) 
  batchNo: string;

  @Column({ name: 'sorting_record_id', type: 'int', nullable: true }) 
  sortingRecordId: number | null;

  @Column({ name: 'voltage', type: 'decimal', precision: 12, scale: 4, nullable: true }) 
  voltage: number | null;

  @Column({ name: 'internal_resistance', type: 'decimal', precision: 12, scale: 2, nullable: true }) 
  internalResistance: number | null;

  @Column({ name: 'capacity', type: 'nvarchar', length: 32, nullable: true }) 
  capacity: string | null;

  @Column({ name: 'k_value', type: 'decimal', precision: 12, scale: 4, nullable: true }) 
  kValue: number | null;

  @Column({ name: 'sorting_time', type: 'datetime2', nullable: true }) 
  sortingTime: Date | null;

  @Column({ name: 'grade', type: 'nvarchar', length: 16, nullable: true }) 
  grade: string | null;

  @Column({ name: 'import_source', type: 'nvarchar', length: 32, nullable: true }) 
  importSource: string | null;

  // OCV1 字段
  @Column({ name: 'ocv1_voltage', type: 'decimal', precision: 12, scale: 4, nullable: true })
  ocv1Voltage: number | null;

  @Column({ name: 'ocv1_resistance', type: 'decimal', precision: 12, scale: 2, nullable: true })
  ocv1Resistance: number | null;

  @Column({ name: 'ocv1_time', type: 'datetime2', nullable: true })
  ocv1Time: Date | null;

  @Column({ name: 'ocv1_equipment_code', type: 'nvarchar', length: 64, nullable: true })
  ocv1EquipmentCode: string | null;

  // OCV2 字段
  @Column({ name: 'ocv2_voltage', type: 'decimal', precision: 12, scale: 4, nullable: true })
  ocv2Voltage: number | null;

  @Column({ name: 'ocv2_resistance', type: 'decimal', precision: 12, scale: 2, nullable: true })
  ocv2Resistance: number | null;

  @Column({ name: 'ocv2_time', type: 'datetime2', nullable: true })
  ocv2Time: Date | null;

  @Column({ name: 'ocv2_equipment_code', type: 'nvarchar', length: 64, nullable: true })
  ocv2EquipmentCode: string | null;

  @CreateDateColumn({ name: 'imported_at' }) 
  importedAt: Date;

  @CreateDateColumn({ name: 'created_at' }) 
  createdAt: Date;
}
