import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiCreatedResponse,
  ApiExtraModels,
  ApiOkResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import SuccessResponseDto from 'src/common/user-interface/http/decorators/success-response.dto';
import Collection from 'src/common/models/Collection';

export const OkResponse = <DataDto extends Type<unknown>>(
  dataDto: DataDto | null,
) => {
  const opts = {
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDto) },
        {
          properties: {
            data: dataDto
              ? { $ref: getSchemaPath(dataDto as DataDto) }
              : { type: 'string', nullable: true, example: null },
          },
        },
      ],
    },
    description: 'Successfully',
  };

  return applyDecorators(
    dataDto
      ? ApiExtraModels(SuccessResponseDto, dataDto)
      : ApiExtraModels(SuccessResponseDto),
    ApiOkResponse(opts),
  );
};

export const CreatedResponse = <DataDto extends Type<unknown>>(
  dataDto: DataDto | null,
) => {
  const opts = {
    schema: {
      allOf: [
        { $ref: getSchemaPath(SuccessResponseDto) },
        {
          properties: {
            data: dataDto
              ? { $ref: getSchemaPath(dataDto as DataDto) }
              : { type: 'string', nullable: true, example: null },
          },
        },
      ],
    },
    description: 'Successfully',
  };

  return applyDecorators(
    dataDto
      ? ApiExtraModels(SuccessResponseDto, dataDto)
      : ApiExtraModels(SuccessResponseDto),
    ApiCreatedResponse(opts),
  );
};

export const PaginatedResponse = <DataDto extends Type<unknown>>(
  dataDto: DataDto,
) =>
  applyDecorators(
    ApiExtraModels(SuccessResponseDto, Collection, dataDto),
    ApiOkResponse({
      schema: {
        allOf: [
          { $ref: getSchemaPath(SuccessResponseDto) },
          {
            properties: {
              data: {
                allOf: [
                  { $ref: getSchemaPath(Collection) },
                  {
                    properties: {
                      edges: {
                        type: 'array',
                        items: { $ref: getSchemaPath(dataDto) },
                      },
                    },
                  },
                ],
              },
            },
          },
        ],
      },
      description: 'Get paginated list records successfully',
    }),
  );
