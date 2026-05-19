import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('cell_barcode')
export class CellBarcode {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 32, unique: true }) barcode: string;
  @Column({ length: 16 }) batchNo: string;
  @Column({ type: 'int', nullable: true }) sortingRecordId: number | null;
  @Column({ type: 'decimal', precision: 6, scale: 4, nullable: true }) voltage: number | null;
  @Column({ type: 'decimal', precision: 6, scale: 2, nullable: true }) internalResistance: number | null;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) capacity: number | null;
  @Column({ name: 'k_value', type: 'decimal', precision: 6, scale: 4, nullable: true }) kValue: number | null;
  @Column({ name: 'sorting_time', type: 'datetime2', nullable: true }) sortingTime: Date | null;
  @Column({ type: 'nvarchar', length: 16, nullable: true }) grade: string | null;
  @Column({ type: 'nvarchar', length: 32, nullable: true }) importSource: string | null;
  @CreateDateColumn() importedAt: Date;
  @CreateDateColumn() createdAt: Date;
}
