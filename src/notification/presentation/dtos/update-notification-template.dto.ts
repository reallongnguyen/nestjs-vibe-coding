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
import { TemplateLanguage } from '../../entities/notification-template.domain';

/**
 * DTO for template content in different languages
 */
export class TemplateContentDto {
  @ApiProperty({
    description: 'Template content in Vietnamese',
    example:
      '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> đã thích bài viết của bạn',
    required: false,
  })
  @IsString()
  @IsOptional()
  [TemplateLanguage.VI]?: string;

  @ApiProperty({
    description: 'Template content in English',
    example:
      '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> liked your post',
    required: false,
  })
  @IsString()
  @IsOptional()
  [TemplateLanguage.EN]?: string;

  /**
   * Index signature to allow accessing content by language key
   * This makes the class compatible with Record<string, string>
   */
  [key: string]: string | undefined;
}

/**
 * DTO for updating a notification template
 */
export class UpdateNotificationTemplateDto {
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
    example: '1.0.1',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+\.\d+\.\d+$/, {
    message: 'Version must be in the format x.y.z (e.g., 1.0.1)',
  })
  version: string;

  @ApiProperty({
    description: 'Optional description of the template update',
    example: 'Updated template to fix a typo',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;
}
