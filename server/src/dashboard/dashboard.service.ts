import { Injectable } from '@nestjs/common';
import { Observable, interval, map, startWith } from 'rxjs';

@Injectable()
export class DashboardService {
  getStreamData(): Observable<any> {
    return interval(5000).pipe(
      startWith(0),
      map(() => {
        return {
          data: {
            topMetrics: {
              totalCells: 15420 + Math.floor(Math.random() * 10),
              coverageRate: 98.5 + (Math.random() - 0.5),
              goodRate: 96.2 + (Math.random() - 0.5)
            },
            processes: [
              { name: '配料', wip: 12 }, { name: '涂布', wip: 20 },
              { name: '辊压', wip: 5 }, { name: '分切', wip: 8 },
              { name: '制片', wip: 15 }, { name: '卷绕', wip: 30 },
              { name: '装配', wip: 25 }, { name: '烘烤', wip: 10 },
              { name: '注液', wip: 5 }, { name: '顶封', wip: 8 },
              { name: '化成', wip: 40 }, { name: '分容', wip: 35 },
              { name: '分选', wip: 18 }
            ],
            sorterLogs: [
              ['C001', '3.95V', '21.5mΩ', 'A档'],
              ['C002', '3.96V', '21.6mΩ', 'A档'],
              ['C003', '3.92V', '22.1mΩ', 'B档']
            ]
          }
        };
      })
    );
  }
}