import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('injection_record')
export class InjectionRecord {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 16 }) batchNo: string;
  @Column({ type: 'tinyint', default: 1 }) recordStatus: number = 1;
  @Column({ default: true }) isDraft: boolean = true;
  @Column({ length: 16 }) equipmentCode: string;
  @Column({ length: 128 }) electrolyteModel: string;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) injectionAmount: number | null;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) injectionHumidity: number | null;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) injectionTemperature: number | null;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) sealingDimension: number | null;
  @Column({ type: 'nvarchar', length: 256, nullable: true }) cleaningRecord: string | null;
  @Column({ length: 32 }) operatorName: string;
  @Column({ type: 'int' }) createdBy: number;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'int', nullable: true }) updatedBy: number | null;
  @UpdateDateColumn() updatedAt: Date | null;
}
