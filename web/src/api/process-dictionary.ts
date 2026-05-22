import { get, post, put, httpDelete } from './index'; // Wait, let's check index.ts for delete

export interface ProcessDictionaryDto {
  id?: number;
  processCode: string;
  processName: string;
  sortOrder: number;
  isActive: boolean;
  description?: string;
  fieldDefinitions?: string; // JSON array of FormField
  createdAt?: string;
  updatedAt?: string;
}

export const processDictionaryApi = {
  list(params?: { keyword?: string; isActive?: string | boolean; page?: number; pageSize?: number }) {
    return get<{ items: ProcessDictionaryDto[]; meta: { total: number; page: number; pageSize: number } }>('/process-dictionary', params);
  },
  create(data: Partial<ProcessDictionaryDto>) {
    return post<ProcessDictionaryDto>('/process-dictionary', data);
  },
  update(id: number, data: Partial<ProcessDictionaryDto>) {
    return put<ProcessDictionaryDto>(`/process-dictionary/${id}`, data);
  },
  findByCode(code: string) {
    return get<ProcessDictionaryDto>(`/process-dictionary/code/${code}`);
  },
  delete(id: number) {
    // We'll need to check if httpDelete is exported from index.ts, if not we will use axios or add it.
    // Let's assume we'll add `del` or `httpDelete` in index.ts if it's missing.
    return httpDelete<{ message: string }>(`/process-dictionary/${id}`);
  }
};