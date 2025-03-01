import { Controller, Get, Query, Redirect, UseFilters } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { RestExceptionFilter, ErrorResponse } from 'src/common';
import { FileService } from './file.service';
import { fileErrorMap } from './models/file-error.map';
import { ViewImageDto } from './dto/view-image.dto';

@Controller({
  path: 'image-proxy',
  version: '1',
})
@UseFilters(new RestExceptionFilter(fileErrorMap))
@ApiTags('image-proxy')
@ErrorResponse('common', fileErrorMap)
export class ImageProxyController {
  constructor(private readonly assetService: FileService) {}

  @Get()
  @Redirect()
  @ApiOperation({
    description: 'View a image through image proxy',
  })
  @ErrorResponse('imageProxy', fileErrorMap)
  async viewImage(@Query() { url }: ViewImageDto) {
    const presignedUrl = await this.assetService.generatePresignedUrl(url);

    return { url: presignedUrl };
  }
}
