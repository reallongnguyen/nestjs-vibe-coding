import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PageOptionsDto } from 'src/common/presentation/dtos/page-options.dto';
import {
  NotificationTemplateDomain,
  TemplateLanguage,
} from '../../entities/notification-template.domain';

/**
 * Template type enum
 */
export enum NotificationTemplateType {
  LIKE_POST = 'likePost',
  COMMENT_POST = 'commentPost',
  FOLLOW_USER = 'followUser',
  MENTION_USER = 'mentionUser',
  WELCOME = 'welcome',
  // Add other template types as needed
}

/**
 * DTO for notification template output
 */
export class NotificationTemplateDto {
  @ApiProperty({
    description: 'Unique identifier for the template',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the template for administrative purposes',
    example: 'Like Post Template',
  })
  name: string;

  @ApiProperty({
    description: 'Type of notification this template is for',
    example: 'likePost',
  })
  type: string;

  @ApiProperty({
    description: 'Template content with Handlebars syntax for each language',
    example: {
      vi: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> đã thích bài viết của bạn',
      en: '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> liked your post',
    },
  })
  content: Record<TemplateLanguage, string>;

  @ApiProperty({
    description: 'Template version for tracking changes',
    example: '1.0.0',
  })
  version: string;

  @ApiProperty({
    description: 'Whether this template is active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'When the template was created',
    example: '2023-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the template was last updated',
    example: '2023-01-01T00:00:00.000Z',
  })
  updatedAt: Date;

  /**
   * Create a DTO from a domain model
   * @param domain Domain model
   * @returns DTO
   */
  static fromDomain(
    domain: NotificationTemplateDomain,
  ): NotificationTemplateDto {
    const dto = new NotificationTemplateDto();
    dto.id = domain.id;
    dto.name = domain.type;
    dto.type = domain.type;
    dto.content = domain.content;
    dto.version = domain.version;
    dto.isActive = domain.isActive;
    dto.createdAt = domain.createdAt;
    dto.updatedAt = domain.updatedAt;
    return dto;
  }
}

/**
 * Alias for NotificationTemplateDto for Swagger documentation
 */
export class NotificationTemplateOutput extends NotificationTemplateDto {}

/**
 * DTO for creating a notification template
 */
export class CreateTemplateDto {
  @ApiProperty({
    description: 'Type of notification this template is for',
    example: 'likePost',
    enum: NotificationTemplateType,
  })
  @IsNotEmpty()
  @IsEnum(NotificationTemplateType)
  type: NotificationTemplateType;

  @ApiProperty({
    description: 'Language of the template',
    example: 'en',
    enum: TemplateLanguage,
  })
  @IsNotEmpty()
  @IsEnum(TemplateLanguage)
  language: TemplateLanguage;

  @ApiProperty({
    description: 'Template title',
    example: 'New like on your post',
  })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Template body content with Handlebars syntax',
    example:
      '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> liked your post',
  })
  @IsNotEmpty()
  @IsString()
  body: string;

  @ApiPropertyOptional({
    description: 'Description of the template for administrative purposes',
    example: "Template shown when a user likes another user's post",
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for updating a notification template
 */
export class UpdateTemplateDto {
  @ApiPropertyOptional({
    description: 'Template title',
    example: 'New like on your post',
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({
    description: 'Template body content with Handlebars syntax',
    example:
      '<d class="font-semibold" type="user">{{ subjects.0.name }}</d> liked your post',
  })
  @IsOptional()
  @IsString()
  body?: string;

  @ApiPropertyOptional({
    description: 'Description of the template for administrative purposes',
    example: "Template shown when a user likes another user's post",
  })
  @IsOptional()
  @IsString()
  description?: string;
}

/**
 * DTO for query parameters when listing notification templates
 */
export class NotificationTemplateListQuery extends PageOptionsDto {
  @ApiPropertyOptional({
    description: 'Filter templates by language',
    example: 'en',
    enum: TemplateLanguage,
  })
  @IsOptional()
  @IsEnum(TemplateLanguage)
  language?: TemplateLanguage;
}

/**
 * DTO for paginated template results
 */
export class PagedTemplateResult {
  @ApiProperty({
    description: 'List of notification templates',
    type: [NotificationTemplateOutput],
  })
  items: NotificationTemplateOutput[];

  @ApiProperty({
    description: 'Total number of templates',
    example: 42,
  })
  total: number;

  @ApiProperty({
    description: 'Current page',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
  })
  pageSize: number;
}

/**
 * DTO for validating a template with test data
 */
export class ValidateTemplateDto {
  @ApiProperty({
    description: 'Test data for template validation',
    example: {
      subjects: [{ id: '123', name: 'John Doe' }],
      target: { id: '456', title: 'My First Post' },
    },
  })
  @IsNotEmpty()
  data: Record<string, unknown>;
}

/**
 * DTO for rendering a template with test data
 */
export class RenderTemplateDto {
  @ApiProperty({
    description: 'Test data for template rendering',
    example: {
      subjects: [{ id: '123', name: 'John Doe' }],
      target: { id: '456', title: 'My First Post' },
    },
  })
  @IsNotEmpty()
  data: Record<string, unknown>;
}
