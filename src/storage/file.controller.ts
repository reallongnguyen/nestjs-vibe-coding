import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RequireAnyRoles,
  AuthGuard,
  RolesGuard,
  Role,
  User,
  AuthContextUser,
  OkResponse,
} from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';

import { FileService } from './file.service';
import { GetImageUploadUrlDto, UploadUrlDto } from './dto/upload-url.dto';

@Controller({
  path: 'files',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('files')
@ErrorResponse(COMMON_ERRORS)
export class FileController {
  constructor(private readonly assetService: FileService) {}

  @Get('avatars/upload-url')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Get the upload url to upload avatar to storage',
    summary: 'Get the upload avatar url',
  })
  @OkResponse(UploadUrlDto)
  @ErrorResponse({})
  async getUploadAvatarUrl(
    @Query() query: GetImageUploadUrlDto,
    @AuthContextUser() user: User,
  ): Promise<UploadUrlDto> {
    const data = await this.assetService.generateUploadAvatarUrl(
      user.id,
      query.mimeType,
      query.size,
    );

    return data;
  }
}
