import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

/**
 * DTO for template validation request
 */
export class ValidateTemplateDto {
  @ApiPropertyOptional({
    description: 'List of required variable names',
    example: ['subjects', 'diObject', 'inObject'],
    type: [String],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  requiredVariables?: string[];

  @ApiPropertyOptional({
    description: 'Sample data to test render the template',
    example: {
      subjects: [{ id: '1', name: 'John Doe' }],
      diObject: { id: '2', name: 'Post Title' },
    },
  })
  @IsOptional()
  @IsObject()
  sampleData?: Record<string, any>;
}

/**
 * DTO for template validation result
 */
export class ValidationResultDto {
  @ApiProperty({
    description: 'Whether the template syntax is valid',
    example: true,
  })
  syntaxValid: boolean;

  @ApiProperty({
    description: 'Whether all required variables are present',
    example: true,
  })
  variablesValid: boolean;

  @ApiPropertyOptional({
    description: 'Missing variables by language',
    example: {
      EN: ['subjects', 'diObject'],
      VI: ['subjects'],
    },
  })
  missingVariables?: Record<string, string[]>;

  @ApiPropertyOptional({
    description: 'Test render results by language',
    example: {
      EN: {
        success: true,
        result: 'John Doe liked your post',
      },
      VI: {
        success: false,
        error: 'Cannot read property "name" of undefined',
      },
    },
  })
  renderResults?: Record<
    string,
    {
      success: boolean;
      result?: string;
      error?: string;
    }
  >;
}
