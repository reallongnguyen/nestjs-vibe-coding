import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { TemplateLanguage } from '../../entities/notification-template.domain';

/**
 * DTO for test rendering a template
 */
export class TestRenderTemplateDto {
  @ApiProperty({
    description: 'Data to render the template with',
    example: {
      subjects: [{ id: '1', name: 'John Doe' }],
      diObject: { id: '2', name: 'Post Title' },
    },
  })
  @IsObject()
  data: Record<string, any>;

  @ApiPropertyOptional({
    description: 'Specific language to render (optional)',
    enum: TemplateLanguage,
    example: TemplateLanguage.EN,
  })
  @IsOptional()
  @IsEnum(TemplateLanguage)
  language?: TemplateLanguage;

  @ApiPropertyOptional({
    description: 'Array of languages to render (optional, overrides language)',
    enum: TemplateLanguage,
    isArray: true,
    example: [TemplateLanguage.EN, TemplateLanguage.VI],
  })
  @IsOptional()
  @IsArray()
  @IsEnum(TemplateLanguage, { each: true })
  languages?: TemplateLanguage[];
}

/**
 * DTO for test render result
 */
export class TestRenderResultDto {
  @ApiProperty({
    description: 'Template ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  templateId: string;

  @ApiProperty({
    description: 'Template type',
    example: 'likePost',
  })
  @IsString()
  templateType: string;

  @ApiProperty({
    description: 'Rendered template by language',
    example: {
      EN: {
        rendered: 'John Doe liked your post',
        success: true,
      },
      VI: {
        rendered: '',
        success: false,
        error: 'Cannot read property "name" of undefined',
      },
    },
  })
  results: Record<
    string,
    {
      rendered: string;
      success: boolean;
      error?: string;
    }
  >;
}
