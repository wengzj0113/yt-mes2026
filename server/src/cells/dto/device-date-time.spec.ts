import 'reflect-metadata';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { Ocv1UploadDto } from './ocv1-upload.dto';
import { Ocv2UploadDto } from './ocv2-upload.dto';
import { SorterUploadDto } from './sorter-upload.dto';

describe('device date-time DTOs', () => {
  it('accepts the local date-time format sent by the OCV2 device', async () => {
    const dto = plainToInstance(Ocv2UploadDto, {
      batchNo: '26000703',
      barcode: 'T26000703000970',
      testTime: '2026-08-15 09:56:21',
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect(dto.testTime).toBe('2026-08-15T09:56:21+08:00');
  });

  it.each([
    ['OCV1', Ocv1UploadDto, 'testTime'],
    ['OCV2', Ocv2UploadDto, 'testTime'],
    ['Sorter', SorterUploadDto, 'sortingTime'],
  ])('keeps standard ISO 8601 values unchanged for %s', async (_name, Dto, field) => {
    const dto = plainToInstance(Dto, {
      batchNo: '26000703',
      barcode: 'T26000703000970',
      [field]: '2026-08-15T01:56:21.000Z',
    });

    await expect(validate(dto)).resolves.toEqual([]);
    expect((dto as unknown as Record<string, unknown>)[field]).toBe('2026-08-15T01:56:21.000Z');
  });
});
