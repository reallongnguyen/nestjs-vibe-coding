import {
  Controller,
  Post,
  Body,
  Get,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import {
  // RequireAnyRoles,
  // RolesGuard,
  AuthGuard,
  // Role,
  AuthContextUser,
  User,
  OkResponse,
  CreatedResponse,
} from 'src/common';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_ERRORS,
} from 'src/common/errors';
import { MediaService } from '../../services/media.service';
import { CreatePresignedUrlDto } from '../dto/create-presigned-url.dto';
import { PresignedUrlResponseDto } from '../dto/presigned-url-response.dto';
import { MediaConfigResponseDto } from '../dto/media-config-response.dto';
import { MEDIA_ERRORS } from '../../entities/errors/media.errors';

@Controller({
  path: 'media',
  version: '1',
})
@UseGuards(AuthGuard)
@UseFilters(GlobalErrorFilter)
@ApiTags('media')
@ApiBearerAuth()
@ErrorResponse(COMMON_ERRORS)
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('presigned-url')
  // @RequireAnyRoles(Role.USER)
  @ApiOperation({
    summary: 'Generate presigned URL for image upload',
    description:
      'Creates a presigned URL for direct upload to Wasabi storage with validation. For inspection files, clientId must be provided as query parameter.',
  })
  @CreatedResponse(PresignedUrlResponseDto)
  @ErrorResponse(MEDIA_ERRORS)
  async generatePresignedUrl(
    @Body() createPresignedUrlDto: CreatePresignedUrlDto,
    @AuthContextUser() user: User,
  ): Promise<PresignedUrlResponseDto> {
    const result = await this.mediaService.generatePresignedUrl(
      user.id.toString(),
      createPresignedUrlDto,
    );

    return {
      success: true,
      data: {
        presignedUrl: result.presignedUrl,
        key: result.key,
        expiresAt: result.expiresAt.toISOString(),
        cdnUrl: result.cdnUrl,
        uploadId: result.uploadId,
        maxFileSizeBytes: result.maxFileSizeBytes,
        method: result.method,
        conditions: result.conditions,
        ...(result.thumbnailUrl && { thumbnailUrl: result.thumbnailUrl }),
        ...(result.fields && { fields: result.fields }),
      },
    };
  }

  @Get('purposes')
  // @RequireAnyRoles(Role.USER, Role.ADMIN)
  @ApiOperation({
    summary: 'List all available upload purposes',
    description:
      'Returns a list of all configured upload purposes with their basic info',
  })
  @OkResponse(MediaConfigResponseDto)
  @ErrorResponse({})
  getAvailablePurposes(): any {
    const purposes = [
      'avatar',
      'general',
      'inspection',
      'property',
      'document',
      'report',
    ];

    const purposeConfigs = purposes.map((purpose) => {
      const config = this.mediaService.getPurposeConfiguration(purpose);
      return {
        purpose,
        maxSizeMb: config.maxSizeMb,
        allowedMimeTypes: config.allowedMimeTypes,
        requiresClientId: config.requiresClientId || false,
        requiresInspectionId: config.requiresInspectionId || false,
        pathPattern: config.pathPattern,
      };
    });

    return {
      success: true,
      data: {
        purposes: purposeConfigs,
      },
    };
  }
}
