import { Test, TestingModule } from '@nestjs/testing';
import { ProcessDictionaryService } from './process-dictionary.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProcessDictionary } from './process-dictionary.entity';
import { DataSource } from 'typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('ProcessDictionaryService', () => {
  let service: ProcessDictionaryService;
  let repo: any;
  let dataSource: any;

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    dataSource = {
      query: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProcessDictionaryService,
        { provide: getRepositoryToken(ProcessDictionary), useValue: repo },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    service = module.get<ProcessDictionaryService>(ProcessDictionaryService);
  });

  describe('remove', () => {
    it('should throw NotFoundException if process not found', async () => {
      repo.findOne.mockResolvedValue(null);
      await expect(service.remove(1)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if process has records', async () => {
      repo.findOne.mockResolvedValue({ id: 1, processCode: 'coating' });
      // Mock that the query returns some data
      dataSource.query.mockResolvedValue([{ id: 1 }]);

      await expect(service.remove(1)).rejects.toThrow(BadRequestException);
      expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('coating_record'));
    });

    it('should delete process if no records found', async () => {
      repo.findOne.mockResolvedValue({ id: 1, processCode: 'coating' });
      // Mock that the query returns empty array
      dataSource.query.mockResolvedValue([]);

      await service.remove(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });

    it('should delete process if table does not exist', async () => {
      repo.findOne.mockResolvedValue({ id: 1, processCode: 'new_process' });
      // Mock that the query throws error (table not found)
      dataSource.query.mockRejectedValue(new Error('Invalid object name'));

      await service.remove(1);
      expect(repo.delete).toHaveBeenCalledWith(1);
    });
  });
});
