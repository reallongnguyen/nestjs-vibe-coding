import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsOptional,
  IsNotEmpty,
  Min,
} from 'class-validator';

export class CreatePresignedUrlDto {
  @ApiProperty({
    description: 'Original filename',
    example: 'avatar.jpg',
  })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({
    description: 'File size in bytes',
    example: 1024000,
    minimum: 1,
  })
  @IsNumber()
  @Min(1)
  fileSize: number;

  @ApiProperty({
    description: 'MIME type of the file',
    example: 'image/jpeg',
  })
  @IsString()
  @IsNotEmpty()
  mimeType: string;

  @ApiProperty({
    description: 'Purpose of the file upload (avatar, general, post, tweet)',
    example: 'avatar',
    required: false,
  })
  @IsString()
  @IsOptional()
  purpose?: string;
}
