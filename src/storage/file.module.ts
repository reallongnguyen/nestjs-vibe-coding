import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { LightConfigModule } from './config/config.module';

@Module({
  imports: [LightConfigModule],
  controllers: [FileController],
  providers: [FileService],
})
export class FileModule {}
