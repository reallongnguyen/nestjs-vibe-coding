import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RequireAnyRoles,
  AuthGuard,
  RolesGuard,
  Role,
  User,
  AuthContextUser,
  OkResponse,
} from 'src/common';
// import { ErrorResponse, COMMON_ERRORS } from 'src/common/errors'; // Removed ErrorResponse and COMMON_ERRORS
import { GlobalErrorFilter } from 'src/common/errors'; // Keep GlobalErrorFilter
import { ApiAppErrors } from 'src/common/swagger/api-app-errors.decorator';
import { CommonErrorCode } from 'src/common/errors/common.error-codes';
import { StorageErrorCode } from './errors/storage.error-codes';

import { FileService } from './file.service';
import { GetImageUploadUrlDto, UploadUrlDto } from './dto/upload-url.dto';
import { GetTweetImageUploadUrlDto } from './dto/tweet-image-upload.dto';

@Controller({
  path: 'files',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('files')
@ApiBearerAuth()
// @ErrorResponse(COMMON_ERRORS) // Removed
export class FileController {
  constructor(private readonly assetService: FileService) {}

  @Get('avatars/upload-url')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Get the upload url to upload avatar to storage',
    summary: 'Get the upload avatar url',
  })
  @OkResponse(UploadUrlDto)
  // @ErrorResponse({}) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    CommonErrorCode.VALIDATION_FAILED,
    StorageErrorCode.AVATAR_UPLOAD_URL_FAILED,
    StorageErrorCode.FILE_UPLOAD_FAILED, // General fallback
  ])
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

  @Get('tweets/upload-url')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Get the upload url to upload tweet image to storage',
    summary: 'Get the upload tweet image url',
  })
  @OkResponse(UploadUrlDto)
  // @ErrorResponse({}) // Removed
  @ApiAppErrors([
    CommonErrorCode.AUTH_INVALID_TOKEN,
    CommonErrorCode.AUTH_NO_PRIVILEGE,
    CommonErrorCode.VALIDATION_FAILED,
    StorageErrorCode.FILE_UPLOAD_FAILED,
  ])
  async getUploadTweetImageUrl(
    @Query() query: GetTweetImageUploadUrlDto,
    @AuthContextUser() user: User,
  ): Promise<UploadUrlDto> {
    const data = await this.assetService.generateUploadTweetImageUrl(
      user.id,
      query.tweetId,
      query.mimeType,
      query.size,
    );

    return data;
  }
}
