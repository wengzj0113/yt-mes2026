import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('process_dictionary')
export class ProcessDictionary {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ unique: true, name: 'process_code' })
  processCode: string;

  @Column({ name: 'process_name' })
  processName: string;

  @Column({ type: 'int', default: 0, name: 'sort_order' })
  sortOrder: number;

  @Column({ default: true, name: 'is_active' })
  isActive: boolean;

  @Column({ nullable: true, name: 'description' })
  description: string;

  @Column({ type: 'nvarchar', length: 'max', nullable: true, name: 'field_definitions' })
  fieldDefinitions: string; // Store JSON array of FormField objects

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
