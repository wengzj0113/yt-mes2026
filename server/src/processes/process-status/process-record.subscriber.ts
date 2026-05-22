import { EntitySubscriberInterface, EventSubscriber, UpdateEvent, InsertEvent, DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';

@EventSubscriber()
@Injectable()
export class ProcessRecordSubscriber implements EntitySubscriberInterface {
  constructor(
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // 注册订阅者
    this.dataSource.subscribers.push(this);
  }

  /**
   * 插入记录后触发
   */
  afterInsert(event: InsertEvent<any>) {
    this.handleEvent(event);
  }

  /**
   * 更新记录后触发
   */
  afterUpdate(event: UpdateEvent<any>) {
    this.handleEvent(event);
  }

  private handleEvent(event: InsertEvent<any> | UpdateEvent<any>) {
    const tableName = event.metadata.tableName;
    // 监听所有以 _record 结尾的工序表
    if (tableName.endsWith('_record')) {
      const entity = event.entity;
      // 只有当实体包含 batchNo 时才触发失效
      if (entity && entity.batchNo) {
        this.eventEmitter.emit('process.record.updated', { batchNo: entity.batchNo });
      }
    }
  }
}
