import {
  Controller,
  Get,
  Query,
  UseFilters,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  AuthContext,
  AuthCtx,
  RequireAnyRoles,
  AuthGuard,
  RolesGuard,
  Role,
} from 'src/common/auth';
import {
  FormatRestResponseInterceptor,
  RestExceptionFilter,
  ErrorResponse,
  OkResponse,
} from 'src/common/presentation/rest';
import { AppError } from 'src/common/models';
import { FileService } from './file.service';
import { GetImageUploadUrlDto, UploadUrlDto } from './dto/upload-url.dto';
import { fileErrorMap } from './models/file-error.map';

@Controller({
  path: 'files',
  version: '1',
})
@UseGuards(AuthGuard, RolesGuard)
@UseInterceptors(new FormatRestResponseInterceptor())
@UseFilters(new RestExceptionFilter(fileErrorMap))
@ApiTags('files')
@ErrorResponse('common', fileErrorMap)
export class FileController {
  constructor(private assetService: FileService) {}

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
    @AuthContext() authCtx: AuthCtx,
  ): Promise<UploadUrlDto> {
    if (!authCtx.person) {
      throw new AppError('common.requirePerson');
    }

    const data = await this.assetService.generateUploadAvatarUrl(
      authCtx.person.userId,
      query.mimeType,
      query.size,
    );

    return data;
  }
}
