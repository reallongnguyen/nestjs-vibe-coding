import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { ImageProxyController } from './image-proxy.controller';
import moduleConfig from './storage.config';

@Module({
  imports: [ConfigModule.forFeature(moduleConfig)],
  controllers: [FileController, ImageProxyController],
  providers: [FileService],
})
export class FileModule {}
