import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('sys_role')
export class SystemRole {
  @PrimaryColumn({ type: 'int' })
  code: number;

  @Column({ type: 'nvarchar', length: 64, unique: true })
  name: string;

  @Column({ type: 'nvarchar', length: 255, nullable: true })
  description: string | null;

  @Column({ name: 'is_system', type: 'bit', default: false })
  isSystem: boolean;

  @Column({ name: 'created_at', type: 'datetime2', default: () => 'GETDATE()' })
  createdAt: Date;
}