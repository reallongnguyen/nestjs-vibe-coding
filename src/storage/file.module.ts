import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { FileController } from './file.controller';
import { FileService } from './file.service';
import { ImageProxyController } from './image-proxy.controller';
import moduleConfig from './storage.config';
import { DeleteImageHandler } from './presentation/handlers/delete-image.handler';

@Module({
  imports: [ConfigModule.forFeature(moduleConfig)],
  controllers: [FileController, ImageProxyController],
  providers: [FileService, DeleteImageHandler],
})
export class FileModule {}
