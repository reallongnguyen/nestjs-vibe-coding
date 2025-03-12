import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ErrorDefinition } from '../app.error';

export interface ErrorResponseOptions {
  description?: string;
  example?: Record<string, unknown>;
}

/**
 * Decorator to document error responses in Swagger
 * @param errors - Map of error codes to their definitions
 * @param options - Additional options for documentation
 */
export function ErrorResponse(
  errors: Record<string, ErrorDefinition>,
  options: ErrorResponseOptions = {},
) {
  // Group errors by status code
  const groupedErrors = new Map<
    number,
    { code: string; definition: ErrorDefinition }[]
  >();

  Object.entries(errors).forEach(([code, definition]) => {
    const group = groupedErrors.get(definition.status) || [];
    group.push({ code, definition });
    groupedErrors.set(definition.status, group);
  });

  // Create decorators for each status code
  const decorators = Array.from(groupedErrors.entries()).map(
    ([status, errorList]) => {
      const examples = errorList.reduce(
        (acc, { code, definition }) => ({
          ...acc,
          [code]: {
            value: {
              code,
              message: definition.message,
              params: options.example || {},
              timestamp: new Date().toISOString(),
            },
          },
        }),
        {},
      );

      return ApiResponse({
        status,
        description: options.description || `${status} Error Response`,
        content: {
          'application/json': {
            examples,
            schema: {
              type: 'object',
              properties: {
                code: { type: 'string', example: errorList[0].code },
                message: {
                  type: 'string',
                  example: errorList[0].definition.message,
                },
                params: {
                  type: 'object',
                  additionalProperties: true,
                  example: options.example || {},
                },
                timestamp: {
                  type: 'string',
                  format: 'date-time',
                  example: new Date().toISOString(),
                },
              },
              required: ['code', 'message', 'timestamp'],
            },
          },
        },
      });
    },
  );

  return applyDecorators(...decorators);
}
