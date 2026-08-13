import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('sorter_api_log')
export class SorterApiLog {
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @Column({ name: 'api_endpoint', length: 128 })
  apiEndpoint: string;

  @Column({ name: 'method', length: 10 })
  method: string;

  @Column({ name: 'request_body', type: 'nvarchar', length: 'max', nullable: true })
  requestBody: string;

  @Column({ name: 'response_body', type: 'nvarchar', length: 'max', nullable: true })
  responseBody: string;

  @Column({ name: 'status_code', type: 'int' })
  statusCode: number;

  @Column({ name: 'is_success', type: 'bit' })
  isSuccess: boolean;

  @Column({ name: 'error_message', type: 'nvarchar', length: 'max', nullable: true })
  errorMessage: string;

  @Column({ name: 'ip', length: 64, nullable: true })
  ip: string;

  @Column({ name: 'duration', type: 'int', nullable: true })
  duration: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'api_type', type: 'nvarchar', length: 16, nullable: true })
  apiType: string | null;
}
