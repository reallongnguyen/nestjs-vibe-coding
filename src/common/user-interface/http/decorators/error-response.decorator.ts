import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import * as lodash from 'lodash';
import FailResponseDto from 'src/common/user-interface/http/decorators/fail-response.dto';
import HttpResponse, {
  HttpError,
} from 'src/common/user-interface/http/HttpResponse';

export const ErrorResponse = (
  errorGroup: string,
  errorMap: Record<string, Record<string, any>>,
  options?: { hasValidationErr: boolean },
) => {
  const errorConfig = lodash.get(errorMap, errorGroup, {});

  if (options?.hasValidationErr) {
    const { validationFailed } = errorMap.validation;
    (errorConfig as any).validationFailed = validationFailed;
  }

  const errorGroups: Record<number, HttpError[]> = {};

  Object.entries(errorConfig).forEach(([type, errorInfo]: [string, any]) => {
    const { status, description } = errorInfo;
    const error: HttpError = {
      message: description,
      name: `${errorGroup}.${type}`,
    };

    if (!errorGroups[status]) {
      errorGroups[status] = [];
    }

    errorGroups[status].push(error);
  });

  const errorDecorators = Object.entries(errorGroups).map(
    ([status, errors]) => {
      const errorSchemas = errors.map((error) => ({
        properties: {
          message: {
            type: 'string',
          },
          error: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              message: {
                type: 'string',
              },
            },
            required: ['message', 'name'],
          },
        },
        example: HttpResponse.error(error.name, errorMap).getResponse(),
        required: ['message', 'error'],
      }));

      return ApiResponse({
        status: Number(status),
        schema: {
          oneOf: errorSchemas,
        },
      });
    },
  );

  return applyDecorators(ApiExtraModels(FailResponseDto), ...errorDecorators);
};
