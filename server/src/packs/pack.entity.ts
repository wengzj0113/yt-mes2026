import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { PackCell } from './pack-cell.entity';

@Entity('pack')
export class Pack {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ length: 64, unique: true, name: 'pack_barcode' })
  packBarcode: string;

  @Column({ type: 'nvarchar', length: 64, nullable: true, name: 'batch_no' })
  batchNo: string | null;

  @Column({ type: 'nvarchar', length: 64, nullable: true, name: 'protection_board_barcode' })
  protectionBoardBarcode: string | null;

  @Column({ type: 'nvarchar', length: 64, nullable: true, name: 'operator_name' })
  operatorName: string | null;

  @OneToMany(() => PackCell, (cell) => cell.pack, { cascade: true })
  cells: PackCell[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
