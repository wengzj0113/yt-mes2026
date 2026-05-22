import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('injection_record')
export class InjectionRecord {
  @PrimaryGeneratedColumn({ name: 'id' }) 
  id: number;

  @Index()
  @Column({ name: 'batch_no', length: 16 }) 
  batchNo: string;

  @Column({ name: 'record_status', type: 'tinyint', default: 1 }) 
  recordStatus: number = 1;

  @Column({ name: 'is_draft', default: true }) 
  isDraft: boolean = true;

  @Column({ name: 'equipment_code', length: 16 }) 
  equipmentCode: string;

  @Column({ name: 'electrolyte_model', length: 128 }) 
  electrolyteModel: string;

  @Column({ name: 'injection_amount', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  injectionAmount: number | null;

  @Column({ name: 'injection_humidity', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  injectionHumidity: number | null;

  @Column({ name: 'injection_temperature', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  injectionTemperature: number | null;

  @Column({ name: 'sealing_dimension', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  sealingDimension: number | null;

  @Column({ name: 'cleaning_record', type: 'nvarchar', length: 256, nullable: true }) 
  cleaningRecord: string | null;

  @Column({ name: 'operator_name', length: 32 }) 
  operatorName: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true, name: 'extra_data' }) 
  extraData: string;

  @Column({ name: 'created_by', type: 'int' }) 
  createdBy: number;

  @CreateDateColumn({ name: 'created_at' }) 
  createdAt: Date;

  @Column({ name: 'updated_by', type: 'int', nullable: true }) 
  updatedBy: number | null;

  @UpdateDateColumn({ name: 'updated_at' }) 
  updatedAt: Date | null;
}
