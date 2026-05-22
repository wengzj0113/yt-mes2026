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

  @Column({ name: 'voltage', type: 'decimal', precision: 6, scale: 4, nullable: true }) 
  voltage: number | null;

  @Column({ name: 'internal_resistance', type: 'decimal', precision: 6, scale: 2, nullable: true }) 
  internalResistance: number | null;

  @Column({ name: 'capacity', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  capacity: number | null;

  @Column({ name: 'k_value', type: 'decimal', precision: 6, scale: 4, nullable: true }) 
  kValue: number | null;

  @Column({ name: 'sorting_time', type: 'datetime2', nullable: true }) 
  sortingTime: Date | null;

  @Column({ name: 'grade', type: 'nvarchar', length: 16, nullable: true }) 
  grade: string | null;

  @Column({ name: 'import_source', type: 'nvarchar', length: 32, nullable: true }) 
  importSource: string | null;

  @CreateDateColumn({ name: 'imported_at' }) 
  importedAt: Date;

  @CreateDateColumn({ name: 'created_at' }) 
  createdAt: Date;
}
