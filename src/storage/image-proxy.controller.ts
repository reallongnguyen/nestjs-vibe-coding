import {
  Controller,
  Get,
  Query,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { CacheInterceptor, CacheTTL } from '@nestjs/cache-manager';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RestExceptionFilter, ErrorResponse } from 'src/common';
import { FileService } from './file.service';
import { fileErrorMap } from './models/file-error.map';
import { ViewImageDto } from './dto/view-image.dto';

const cacheTime = 1000 * (60 * 14 + 50);

@Controller({
  path: 'image-proxy',
  version: '1',
})
@UseFilters(new RestExceptionFilter(fileErrorMap))
@ApiTags('image-proxy (deprecated)')
@ErrorResponse('common', fileErrorMap)
export class ImageProxyController {
  constructor(private readonly assetService: FileService) {}

  @Get()
  @UseInterceptors(CacheInterceptor)
  @CacheTTL(cacheTime)
  @ApiOperation({
    description: 'View a image through image proxy',
  })
  @ErrorResponse('imageProxy', fileErrorMap)
  async viewImage(@Query() { url }: ViewImageDto) {
    const presignedUrl = await this.assetService.generatePresignedUrl(url);

    return { url: presignedUrl };
  }
}
