import { ApiProperty } from '@nestjs/swagger';

export class MaxFileSize {
  @ApiProperty({
    description: 'Maximum file size in megabytes',
    example: 64,
  })
  mb: number;

  @ApiProperty({
    description: 'Maximum file size in bytes',
    example: 67108864,
  })
  bytes: number;
}

export class MediaConfigData {
  @ApiProperty({
    description: 'Upload purpose',
    example: 'avatar',
    required: false,
  })
  purpose?: string;

  @ApiProperty({
    description: 'Maximum file size configuration',
    type: MaxFileSize,
  })
  maxFileSize: MaxFileSize;

  @ApiProperty({
    description: 'List of allowed MIME types',
    example: ['image/jpeg', 'image/png', 'image/gif'],
    type: [String],
  })
  allowedTypes: string[];

  @ApiProperty({
    description: 'Path pattern for file storage',
    example: 'users/{userId}/avatar/{timestamp}-{uuid}.{ext}',
    required: false,
  })
  pathPattern?: string;

  @ApiProperty({
    description: 'Presigned URL expiry time in seconds',
    example: 3600,
    required: false,
  })
  presignedUrlExpirySeconds?: number;

  @ApiProperty({
    description: 'Whether clientId is required',
    example: false,
    required: false,
  })
  requiresClientId?: boolean;

  @ApiProperty({
    description: 'Whether inspectionId is required',
    example: false,
    required: false,
  })
  requiresInspectionId?: boolean;

  @ApiProperty({
    description: 'Additional validation rules',
    example: {},
    required: false,
  })
  additionalValidation?: Record<string, any>;
}

export class MediaConfigResponseDto {
  @ApiProperty({
    description: 'Request success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Media configuration data',
    type: MediaConfigData,
  })
  data: MediaConfigData;
}
