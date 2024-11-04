import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsNotEmpty, Max, Min } from 'class-validator';
import { Transform } from 'class-transformer';
import { AvatarMimeType } from '../models/file-type.enum';

export class GetImageUploadUrlDto {
  @ApiProperty({
    description: 'file size',
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
    description: 'upload image url',
    type: String,
    example: 'https://storage.googleapis.com/...',
  })
  uploadUrl: string;

  @ApiProperty({
    description: 'upload image url expires time',
    type: Number,
    example: 1718472026584,
  })
  expires: number;

  @ApiProperty({
    description: 'original object Url on Storage',
    type: String,
    example: 'gs://bucket/user/avatar/img.jpeg',
  })
  objectUrl: string;

  @ApiProperty({
    description: 'signed Url',
    type: String,
    example: 'https://storage.googleapis.com/...',
  })
  signedUrl: string;
}
