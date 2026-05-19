import { Equipment } from './equipment.entity';

describe('Equipment Entity', () => {
  it('should create equipment with code and name', () => {
    const eq = new Equipment();
    eq.equipmentCode = 'E001';
    eq.equipmentName = '涂布机-01';
    eq.departmentCode = 'PROD';

    expect(eq.equipmentCode).toBe('E001');
    expect(eq.equipmentName).toBe('涂布机-01');
    expect(eq.isActive).toBe(true);
  });
});
