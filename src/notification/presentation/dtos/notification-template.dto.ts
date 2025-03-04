import { ApiProperty } from '@nestjs/swagger';
import {
  NotificationTemplateDomain,
  TemplateLanguage,
} from '../../entities/notification-template.domain';

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
    dto.name = domain.name;
    dto.type = domain.type;
    dto.content = domain.content;
    dto.version = domain.version;
    dto.isActive = domain.isActive;
    dto.createdAt = domain.createdAt;
    dto.updatedAt = domain.updatedAt;
    return dto;
  }
}
