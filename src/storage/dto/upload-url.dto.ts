import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { AvatarMimeType } from '../models/file-type.enum';

export class GetImageUploadUrlDto {
  @ApiProperty({
    description: 'file size in byte',
    type: Number,
    example: 1024,
  })
  @Max(5000000)
  @Min(1)
  @IsInt()
  @Transform(({ value }) => Number(value))
  @IsNotEmpty()
  size: number;

  @ApiProperty({
    description: 'file type',
    type: String,
    enum: AvatarMimeType,
    example: 'image/jpeg',
  })
  @IsEnum(AvatarMimeType)
  @IsNotEmpty()
  mimeType: AvatarMimeType;
}

export class UploadUrlDto {
  @ApiProperty({
    description: 'upload file url',
    type: String,
    example: 'https://storage.googleapis.com/...',
  })
  uploadUrl: string;

  @ApiProperty({
    description:
      'headers that must be attached in a request when uploading file',
    type: 'object',
    properties: {
      'Content-Type': { type: String },
      'x-goog-content-length-range': { type: String },
    },
    example: {
      'Content-Type': 'application/octet-stream',
      'x-goog-content-length-range': `0,5000000`,
    },
  })
  uploadHeaders: object;

  @ApiProperty({
    description: 'upload file url expires time',
    type: Number,
    example: 1718472026584,
  })
  expires: number;

  @ApiProperty({
    description: 'original object url on Storage',
    type: String,
    example: 'gs://example-bucket/users/01/profile/02.jpeg',
  })
  objectUrl: string;

  @ApiProperty({
    description: 'signed Url',
    type: String,
    example: 'https://storage.googleapis.com/...',
  })
  signedUrl: string;
}
