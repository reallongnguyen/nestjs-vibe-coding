import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { TemplateContentDto } from './update-notification-template.dto';

/**
 * DTO for creating a notification template
 */
export class CreateNotificationTemplateDto {
  @ApiProperty({
    description: 'Name of the template for administrative purposes',
    example: 'Like Post Template',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Type of notification this template is for',
    example: 'likePost',
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty({
    description: 'Template content with Handlebars syntax for each language',
    example: {
      VI: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> đã thích bài viết của bạn',
      EN: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> liked your post',
    },
    type: TemplateContentDto,
  })
  @IsObject()
  @ValidateNested()
  @Type(() => TemplateContentDto)
  content: TemplateContentDto;

  @ApiProperty({
    description: 'Template version for tracking changes',
    example: '1.0.0',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be in the format x.y.z (e.g., 1.0.0)',
  })
  version: string;

  @ApiProperty({
    description: 'Optional description of the template',
    example: 'Template for notification when a user likes a post',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
