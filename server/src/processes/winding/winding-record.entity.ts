import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('winding_record')
export class WindingRecord {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 16 }) batchNo: string;
  @Column({ type: 'tinyint', default: 1 }) recordStatus: number = 1;
  @Column({ default: true }) isDraft: boolean = true;
  @Column({ length: 16 }) equipmentCode: string;
  @Column({ length: 128 }) separatorModel: string;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) windingSpeed: number;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) windingTension: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) coreThickness: number | null;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) coreDiameter: number | null;
  @Column({ length: 32 }) operatorName: string;
  @Column({ type: 'int' }) createdBy: number;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'int', nullable: true }) updatedBy: number | null;
  @UpdateDateColumn() updatedAt: Date | null;
}
