import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index } from 'typeorm';

@Entity('assembly_record')
export class AssemblyRecord {
  @PrimaryGeneratedColumn({ name: 'id' }) 
  id: number;

  @Index()
  @Column({ name: 'batch_no', length: 16 }) 
  batchNo: string;

  @Column({ name: 'record_status', type: 'tinyint', default: 1 }) 
  recordStatus: number = 1;

  @Column({ name: 'is_draft', default: true }) 
  isDraft: boolean = true;

  @Column({ name: 'casing_equipment_code', length: 16 }) 
  casingEquipmentCode: string;

  @Column({ name: 'shell_model', length: 128 }) 
  shellModel: string;

  @Column({ name: 'bottom_weld_equipment', length: 16 }) 
  bottomWeldEquipment: string;

  @Column({ name: 'bottom_weld_params', length: 256 }) 
  bottomWeldParams: string;

  @Column({ name: 'bottom_weld_pull', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  bottomWeldPull: number | null;

  @Column({ name: 'groove_record', type: 'nvarchar', length: 256, nullable: true }) 
  grooveRecord: string | null;

  @Column({ name: 'cap_model', length: 128 }) 
  capModel: string;

  @Column({ name: 'cap_welding_pull', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  capWeldingPull: number | null;

  @Column({ name: 'tab_welding_pull', type: 'decimal', precision: 8, scale: 2, nullable: true }) 
  tabWeldingPull: number | null;

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
