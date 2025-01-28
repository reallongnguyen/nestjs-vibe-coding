import { Controller, Get, Query, UseFilters, UseGuards } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  RequireAnyRoles,
  AuthGuard,
  RolesGuard,
  Role,
  User,
  AuthContextUser,
} from 'src/common/auth';
import {
  RestExceptionFilter,
  ErrorResponse,
  OkResponse,
} from 'src/common/presentation/rest';
import { FileService } from './file.service';
import { GetImageUploadUrlDto, UploadUrlDto } from './dto/upload-url.dto';
import { fileErrorMap } from './models/file-error.map';

@Controller({
  path: 'files',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseFilters(new RestExceptionFilter(fileErrorMap))
@ApiTags('files')
@ErrorResponse('common', fileErrorMap)
export class FileController {
  constructor(private readonly assetService: FileService) {}

  @Get('avatars/upload-url')
  @RequireAnyRoles(Role.USER)
  @ApiOperation({
    description: 'Get the upload url to upload avatar to storage',
    summary: 'Get the upload avatar url',
  })
  @OkResponse(UploadUrlDto)
  @ErrorResponse('file.getUploadAvatarUrl', fileErrorMap)
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
