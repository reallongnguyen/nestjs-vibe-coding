import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { LoggerModule } from 'nestjs-pino';
import { MediaController } from './presentation/controllers/media.controller';
import { MediaService } from './services/media.service';
import { GcsService } from './services/gcs.service';
import { ValidationService } from './services/validation.service';
import { mediaConfig } from './media.config';

@Module({
  imports: [ConfigModule.forFeature(mediaConfig), LoggerModule],
  controllers: [MediaController],
  providers: [MediaService, GcsService, ValidationService],
  exports: [MediaService],
})
export class MediaModule {}
