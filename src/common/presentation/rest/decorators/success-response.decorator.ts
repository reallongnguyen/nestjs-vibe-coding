import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import { PagedResult } from '../../../models/PagedResult';

export const OkResponse = <DataDto extends Type<unknown>>(
  dataDto: DataDto | null,
) => {
  const opts = {
    schema: dataDto ? { $ref: getSchemaPath(dataDto) } : { properties: {} },
    description: 'Successfully',
  };

  const decorators = [ApiOkResponse(opts)];

  if (dataDto) {
    decorators.push(ApiExtraModels(dataDto));
  }

  return applyDecorators(...decorators);
};

export const CreatedResponse = <DataDto extends Type<unknown>>(
  dataDto: DataDto | null,
) => {
  const opts = {
    schema: dataDto ? { $ref: getSchemaPath(dataDto) } : { properties: {} },
    description: 'Successfully',
  };

  const decorators = [ApiCreatedResponse(opts)];

  if (dataDto) {
    decorators.push(ApiExtraModels(dataDto));
  }

  return applyDecorators(...decorators);
};

export const PaginatedResponse = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
) =>
  applyDecorators(
    ApiExtraModels(PagedResult, dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(PagedResult) },
          {
            properties: {
              items: {
                type: 'array',
                items: { $ref: getSchemaPath(dataDto) },
              },
            },
          },
        ],
      },
      description: 'Get paginated list records successfully',
    }),
  );
