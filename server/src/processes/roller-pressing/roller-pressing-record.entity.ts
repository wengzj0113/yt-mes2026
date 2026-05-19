import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('roller_pressing_record')
export class RollerPressingRecord {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 16 }) batchNo: string;
  @Column({ type: 'tinyint', default: 1 }) recordStatus: number = 1;
  @Column({ default: true }) isDraft: boolean = true;
  @Column({ length: 16 }) equipmentCode: string;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) rollerPressure: number;
  @Column({ type: 'decimal', precision: 8, scale: 2 }) rollerThickness: number;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) rollerSpeed: number | null;
  @Column({ length: 32 }) operatorName: string;
  @Column({ type: 'int' }) createdBy: number;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'int', nullable: true }) updatedBy: number | null;
  @UpdateDateColumn() updatedAt: Date | null;
}
