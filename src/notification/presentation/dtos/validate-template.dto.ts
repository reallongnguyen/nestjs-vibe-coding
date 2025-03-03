import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsString } from 'class-validator';

/**
 * DTO for validating a notification template
 */
export class ValidateTemplateDto {
  @ApiProperty({
    description:
      'List of required variables that should be present in the template',
    example: ['subjects.0.name', 'content.title'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  requiredVariables: string[];
}

/**
 * DTO for validation result
 */
export class ValidationResultDto {
  @ApiProperty({
    description: 'Whether the template is valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Missing variables by language if template is invalid',
    example: {
      EN: ['subjects.0.name'],
      VI: ['content.title'],
    },
    required: false,
    type: Object,
  })
  missingVariables?: Record<string, string[]>;
}
