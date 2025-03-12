import { Module, Global } from '@nestjs/common';
import { GlobalErrorFilter } from './error.filter';

@Global()
@Module({
  exports: [GlobalErrorFilter],
})
export class ErrorModule {}
