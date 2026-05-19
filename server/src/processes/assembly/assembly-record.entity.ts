import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('assembly_record')
export class AssemblyRecord {
  @PrimaryGeneratedColumn() id: number;
  @Column({ length: 16 }) batchNo: string;
  @Column({ type: 'tinyint', default: 1 }) recordStatus: number = 1;
  @Column({ default: true }) isDraft: boolean = true;
  @Column({ length: 16 }) casingEquipmentCode: string;
  @Column({ length: 128 }) shellModel: string;
  @Column({ length: 16 }) bottomWeldEquipment: string;
  @Column({ length: 256 }) bottomWeldParams: string;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) bottomWeldPull: number | null;
  @Column({ type: 'nvarchar', length: 256, nullable: true }) grooveRecord: string | null;
  @Column({ length: 128 }) capModel: string;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) capWeldingPull: number | null;
  @Column({ type: 'decimal', precision: 8, scale: 2, nullable: true }) tabWeldingPull: number | null;
  @Column({ length: 32 }) operatorName: string;
  @Column({ type: 'int' }) createdBy: number;
  @CreateDateColumn() createdAt: Date;
  @Column({ type: 'int', nullable: true }) updatedBy: number | null;
  @UpdateDateColumn() updatedAt: Date | null;
}
