import { ApiProperty } from '@nestjs/swagger';

export class PresignedUrlData {
  @ApiProperty({
    description: 'Presigned URL for direct upload to Wasabi',
    example: 'https://s3.us-east-2.wasabisys.com/bucket/key?signature...',
  })
  presignedUrl: string;

  @ApiProperty({
    description: 'Unique file key in storage',
    example: 'users/1/avatar/1640995200000-abc123.jpg',
  })
  key: string;

  @ApiProperty({
    description: 'Expiration timestamp of the presigned URL',
    example: '2024-01-01T12:00:00.000Z',
  })
  expiresAt: string;

  @ApiProperty({
    description: 'Future CDN URL for accessing the file after upload',
    example: 'https://cdn.example.com/user123/avatar/1640995200000-abc123.jpg',
  })
  cdnUrl: string;

  @ApiProperty({
    description:
      'Cloudflare image transformation URL for thumbnails (only for images)',
    example:
      'https://cdn.example.com/cdn-cgi/image/width=128,height=128,quality=75,format=jpeg/user123/avatar/1640995200000-abc123.jpg',
    required: false,
  })
  thumbnailUrl?: string;

  @ApiProperty({
    description: 'Upload tracking ID for confirmation',
    example: 'upload_abc123def456',
  })
  uploadId: string;

  @ApiProperty({
    description:
      'Maximum file size allowed in bytes (enforced by storage provider)',
    example: 10485760,
  })
  maxFileSizeBytes: number;

  @ApiProperty({
    description: 'HTTP method to use for upload',
    example: 'PUT',
  })
  method: string;

  @ApiProperty({
    description: 'Policy conditions enforced by the storage provider',
    example: [
      ['content-length-range', 1, 10485760],
      ['starts-with', '$Content-Type', ''],
    ],
  })
  conditions: any[];

  @ApiProperty({
    description: 'Form fields for POST upload (only for POST method)',
    example: {
      'Content-Type': 'image/jpeg',
      'x-amz-meta-purpose': 'avatar',
    },
    required: false,
  })
  fields?: Record<string, string>;
}

export class PresignedUrlResponseDto {
  @ApiProperty({ description: 'Request success status' })
  success: boolean;

  @ApiProperty({ description: 'Response data' })
  data: PresignedUrlData;

  @ApiProperty({ description: 'Error message if any', required: false })
  error?: string;
}
