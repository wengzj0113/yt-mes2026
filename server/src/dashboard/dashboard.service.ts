import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual } from 'typeorm';
import { Observable, interval, map, startWith, from, switchMap } from 'rxjs';
import { CellBarcode } from '../cells/cell-barcode.entity';
import { Batch } from '../batch/batch.entity';
import { BatchStatus } from '../batch/batch.entity';

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(CellBarcode)
    private readonly cellBarcodeRepo: Repository<CellBarcode>,
    @InjectRepository(Batch)
    private readonly batchRepo: Repository<Batch>,
  ) {}

  async fetchRealMetrics() {
    const [totalCells, batches, todayCells, todayPassCells] = await Promise.all([
      this.cellBarcodeRepo.count(),
      this.batchRepo.find({ order: { createdAt: 'DESC' }, take: 10 }),
      this.cellBarcodeRepo.count({
        where: { createdAt: MoreThanOrEqual(new Date(new Date().setHours(0, 0, 0, 0))) },
      }),
      this.cellBarcodeRepo.count({
        where: {
          createdAt: MoreThanOrEqual(new Date(new Date().setHours(0, 0, 0, 0))),
          grade: 'A',
        },
      }),
    ]);

    const totalBatches = await this.batchRepo.count();
    const batchesWithBarcodes = await this.batchRepo
      .createQueryBuilder('batch')
      .innerJoin('cell_barcode', 'cb', 'cb.batchNo = batch.batchNo')
      .select('COUNT(DISTINCT batch.batchNo)', 'count')
      .getRawOne();
    const coverageRate = totalBatches > 0
      ? (Number(batchesWithBarcodes?.count ?? 0) / totalBatches) * 100
      : 0;
    const goodRate = todayCells > 0 ? (todayPassCells / todayCells) * 100 : 0;

    return {
      topMetrics: {
        totalCells,
        coverageRate: parseFloat(coverageRate.toFixed(1)),
        goodRate: parseFloat(goodRate.toFixed(1)),
      },
      processes: [
        { name: '配料', wip: 0 }, { name: '涂布', wip: 0 },
        { name: '辊压', wip: 0 }, { name: '分切', wip: 0 },
        { name: '制片', wip: 0 }, { name: '卷绕', wip: 0 },
        { name: '装配', wip: 0 }, { name: '烘烤', wip: 0 },
        { name: '注液', wip: 0 }, { name: '顶封', wip: 0 },
        { name: '化成', wip: 0 }, { name: '分容', wip: 0 },
        { name: '分选', wip: 0 },
      ],
      sorterLogs: [
        ['C001', '3.95V', '21.5mΩ', 'A档'],
        ['C002', '3.96V', '21.6mΩ', 'A档'],
        ['C003', '3.92V', '22.1mΩ', 'B档'],
      ],
    };
  }

  getStreamData(): Observable<any> {
    return interval(30000).pipe(
      startWith(0),
      switchMap(() => from(this.fetchRealMetrics())),
      map((data) => ({ data })),
    );
  }
}
