import { applyDecorators } from '@nestjs/common';
import { ApiResponse } from '@nestjs/swagger';
import { ALL_APP_ERRORS } from '../errors/error-registry';
import { ApiErrorResponseDto } from '../presentation/rest/dto/api-error-response.dto';

/**
 * A custom NestJS decorator that aggregates multiple @ApiResponse decorators
 * for standard application errors defined in ALL_APP_ERRORS.
 *
 * @param errorCodes An array of error code strings to generate responses for.
 */
export function ApiAppErrors(errorCodes: string[]) {
  const responses = errorCodes
    .map((code) => {
      const definition = ALL_APP_ERRORS[code];
      if (!definition) {
        console.warn(
          `Swagger Decorator: Error code "${code}" not found in ALL_APP_ERRORS. Skipping.`,
        );
        return null;
      }
      return ApiResponse({
        status: definition.status,
        description: `Error Code: ${code}. Message: ${definition.message} (Note: This message can be internationalized by the client using the error code).`,
        type: ApiErrorResponseDto,
        content: {
          'application/json': {
            example: {
              code: code,
              message: definition.message,
              // params: {} // Intentionally omitted for generic example, can be added if specific error codes often include params
              timestamp: new Date().toISOString(), // Dynamic timestamp for fresh example
            },
          },
        },
      });
    })
    .filter((response): response is NonNullable<typeof response> =>
      response !== null,
    ); // Type guard to filter out nulls and satisfy TypeScript

  return applyDecorators(...responses);
}
