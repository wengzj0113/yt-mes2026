import { Department } from './department.entity';

describe('Department Entity', () => {
  it('should create a department with code and name', () => {
    const dept = new Department();
    dept.name = '生产部';
    dept.code = 'PROD';

    expect(dept.name).toBe('生产部');
    expect(dept.code).toBe('PROD');
    expect(dept.isActive).toBe(true);
  });
});
