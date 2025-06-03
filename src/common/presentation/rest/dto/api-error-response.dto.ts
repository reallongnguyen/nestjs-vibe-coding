import { ApiProperty } from '@nestjs/swagger';

/**
 * Defines the structure of a standardized JSON error response.
 * Used for Swagger documentation via @ErrorResponse decorator in controllers.
 */
export class ApiErrorResponseDto {
  @ApiProperty({
    description: 'A unique application-specific error code.',
    example: 'USER_NOT_FOUND',
    type: String,
  })
  code: string;

  @ApiProperty({
    description: 'A human-readable message describing the error.',
    example: 'User was not found',
    type: String,
  })
  message: string;

  @ApiProperty({
    description:
      'Optional. Additional parameters related to the error, providing more context.',
    example: { userId: '123', reason: 'database_timeout' },
    type: 'object',
    additionalProperties: true,
    required: false,
  })
  params?: Record<string, unknown>;

  @ApiProperty({
    description: 'The ISO 8601 timestamp indicating when the error occurred.',
    example: '2023-10-27T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  timestamp: string;
}
