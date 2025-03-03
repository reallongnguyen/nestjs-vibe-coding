import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsObject, IsOptional } from 'class-validator';
import { TemplateLanguage } from '../../entities/notification-template.domain';

/**
 * DTO for test rendering a notification template
 */
export class TestRenderTemplateDto {
  @ApiProperty({
    description: 'Data to be used for rendering the template',
    example: {
      subjects: [
        {
          id: '123',
          name: 'John Doe',
          avatar: 'https://example.com/avatar.jpg',
        },
      ],
      content: {
        title: 'My First Post',
        id: '456',
      },
    },
    type: Object,
  })
  @IsObject()
  data: Record<string, any>;

  @ApiProperty({
    description:
      'Optional language to render the template in. If not provided, all available languages will be rendered.',
    enum: TemplateLanguage,
    example: TemplateLanguage.EN,
    required: false,
  })
  @IsEnum(TemplateLanguage)
  @IsOptional()
  language?: TemplateLanguage;
}

/**
 * DTO for test render result
 */
export class TestRenderResultDto {
  @ApiProperty({
    description: 'Rendered template content by language',
    example: {
      EN: '<d class="font-semibold" type="user">John Doe</d> liked your post',
      VI: '<d class="font-semibold" type="user">John Doe</d> đã thích bài viết của bạn',
    },
    type: Object,
  })
  rendered: Record<TemplateLanguage, string>;
}
