import { Global, Module } from '@nestjs/common';
import { AppConfigModule } from 'src/common/configuration/config.module';
import { ImageUrlService } from './services/image-url.service';

@Global()
@Module({
  imports: [AppConfigModule],
  providers: [ImageUrlService],
  exports: [ImageUrlService],
})
export class ImgProxyModule {}
