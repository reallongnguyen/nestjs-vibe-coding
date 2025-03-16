import { Module, Global } from '@nestjs/common';
import { GlobalErrorFilter } from './error.filter';

@Global()
@Module({
  providers: [GlobalErrorFilter],
  exports: [GlobalErrorFilter],
})
export class ErrorModule {}
