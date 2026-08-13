import { SetMetadata } from '@nestjs/common';
import { ApiType } from '../interceptors/sorter-api-log.interceptor';

export const API_TYPE_KEY = 'api_type';

export const ApiTypeDecorator = (apiType: ApiType) => SetMetadata(API_TYPE_KEY, apiType);