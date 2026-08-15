import { BadRequestException } from '@nestjs/common';
import { ProcessDynamicService } from './process-dynamic.service';

describe('ProcessDynamicService', () => {
  const repo = {
    findOne: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn((value) => Promise.resolve(value)),
  } as any;
  const batchRepo = { findOne: jest.fn() } as any;
  const dictionaryRepo = { findOne: jest.fn() } as any;
  let service: ProcessDynamicService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ProcessDynamicService(repo, batchRepo, dictionaryRepo);
    batchRepo.findOne.mockResolvedValue({ batchNo: 'BAT-397873' });
    repo.findOne.mockResolvedValue(null);
    dictionaryRepo.findOne.mockResolvedValue(null);
  });

  it('submits Excel-defined fields instead of checking legacy batching columns', async () => {
    const data = {
      positiveActiveMaterial: '正极材料',
      positiveSlurryViscosity: 1,
      positiveSlurrySolids: 1,
      negativeActiveMaterial: '负极材料',
      negativeSlurryViscosity: 1,
      negativeSlurrySolids: 1,
      operatorName: '系统管理员',
    };

    const result = await service.submit('batching', 'BAT-397873', data, 1);

    expect(result.isDraft).toBe(false);
    expect(result.recordStatus).toBe(1);
    expect(JSON.parse(result.extraData!)).toEqual(data);
  });

  it('reports the configured labels when a required Excel field is missing', async () => {
    await expect(service.submit('batching', 'BAT-397873', { operatorName: '系统管理员' }, 1))
      .rejects.toMatchObject({ response: { code: 'PROCESS_FIELDS_INCOMPLETE' } });
    try {
      await service.submit('batching', 'BAT-397873', { operatorName: '系统管理员' }, 1);
    } catch (error) {
      expect((error as BadRequestException).getResponse()).toMatchObject({
        message: expect.stringContaining('正极活性材料'),
      });
    }
  });

  it('uses dictionary required and numeric constraints when validating submission', async () => {
    dictionaryRepo.findOne.mockResolvedValue({
      processCode: 'batching',
      fieldDefinitions: JSON.stringify([
        { key: 'positiveSlurryViscosity', label: '正极浆料粘度', type: 'number', required: true, min: 2, max: 5 },
      ]),
    });

    await expect(service.submit('batching', 'BAT-397873', { positiveSlurryViscosity: 1 }, 1))
      .rejects.toMatchObject({ response: { code: 'PROCESS_FIELDS_INVALID' } });
  });

  it('validates against the saved draft when the submit request only carries quality fields', async () => {
    const draft = {
      processCode: 'batching',
      batchNo: 'BAT-397873',
      extraData: JSON.stringify({
        positiveActiveMaterial: '姝ｆ瀬鏉愭枡',
        positiveSlurryViscosity: 1,
        positiveSlurrySolids: 1,
        negativeActiveMaterial: '璐熸瀬鏉愭枡',
        negativeSlurryViscosity: 1,
        negativeSlurrySolids: 1,
      }),
      isDraft: true,
    };
    repo.findOne.mockResolvedValue(draft);

    const result = await service.submit('batching', 'BAT-397873', { operatorName: '绯荤粺绠＄悊鍛?' }, 1);

    expect(result.isDraft).toBe(false);
    expect(JSON.parse(result.extraData!)).toMatchObject({
      positiveActiveMaterial: '姝ｆ瀬鏉愭枡',
      operatorName: '绯荤粺绠＄悊鍛?',
    });
  });
});
