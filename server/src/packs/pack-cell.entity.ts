import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Pack } from './pack.entity';

@Entity('pack_cell')
export class PackCell {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ length: 64, name: 'cell_barcode' })
  cellBarcode: string;

  @ManyToOne(() => Pack, (pack) => pack.cells, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'pack_id' })
  pack: Pack;

  @Column({ name: 'pack_id' })
  packId: number;
}
