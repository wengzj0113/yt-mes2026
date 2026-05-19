import { ResponseInterceptor } from './response.interceptor';
import { of } from 'rxjs';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;
  const mockContext = {} as any;

  it('should wrap plain data in envelope', (done) => {
    interceptor = new ResponseInterceptor();
    const handler = { handle: () => of({ id: 1, name: 'test' }) };

    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: { id: 1, name: 'test' },
        message: 'ok',
      });
      done();
    });
  });

  it('should pass through already-wrapped response', (done) => {
    interceptor = new ResponseInterceptor();
    const wrapped = { success: true, data: 'hello', message: 'ok' };
    const handler = { handle: () => of(wrapped) };

    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toBe(wrapped);
      done();
    });
  });

  it('should handle null data', (done) => {
    interceptor = new ResponseInterceptor();
    const handler = { handle: () => of(null) };

    interceptor.intercept(mockContext, handler).subscribe((result) => {
      expect(result).toEqual({
        success: true,
        data: null,
        message: 'ok',
      });
      done();
    });
  });
});
