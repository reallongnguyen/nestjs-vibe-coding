import { Module } from '@nestjs/common';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { LightConfigModule } from './config/config.module';
import { ImageProxyController } from './image-proxy.controller';

@Module({
  imports: [LightConfigModule],
  controllers: [FileController, ImageProxyController],
  providers: [FileService],
})
export class FileModule {}
