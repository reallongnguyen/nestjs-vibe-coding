import { applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiResponse } from '@nestjs/swagger';
import * as lodash from 'lodash';
import FailResponseDto from './fail-response.dto';
import RestResponse, { RestError } from '../RestResponse';

export const ErrorResponse = (
  errorGroup: string,
  errorMap: Record<string, Record<string, any>>,
  options?: { hasValidationErr: boolean },
) => {
  const errorConfig = lodash.get(errorMap, errorGroup, {});

  if (options?.hasValidationErr && errorMap?.validation?.validationFailed) {
    const { validationFailed } = errorMap.validation;
    (errorConfig as any).validationFailed = validationFailed;
  }

  const errorGroups: Record<number, RestError[]> = {};

  Object.entries(errorConfig).forEach(([type, errorInfo]: [string, any]) => {
    const { status, description } = errorInfo;
    const error: RestError = {
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
        example: RestResponse.error(error.name, errorMap).getResponse(),
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
