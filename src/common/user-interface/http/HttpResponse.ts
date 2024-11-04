import { HttpException, HttpStatus, ValidationError } from '@nestjs/common';
import { ApiProperty } from '@nestjs/swagger';
import { get } from 'lodash';
import { commonErrorMap } from '../../models/common-error.map';

export interface HttpError extends Error {
  name: string;
  message: string;
}

export enum MessageType {
  // 200 201
  SUCCESS = 'success',
  // 400
  VALIDATION_FAILED = 'validation_failed',
  BAD_REQUEST = 'bad_request',
  // 401
  UNAUTHORIZED = 'authentication_failed',
  // 403
  FORBIDDEN = 'forbidden',
  // 404
  NOT_FOUND = 'not_found',
  // 500
  INTERNAL_SERVER_ERROR = 'internal_server_error',
}

export default class HttpResponse<T> {
  @ApiProperty({
    description: 'API response message',
    example: MessageType.SUCCESS,
  })
  message: string;

  @ApiProperty({
    description: 'API response error',
  })
  error?: HttpError;

  @ApiProperty({
    description: 'API response data',
  })
  data?: T;

  constructor(message: string, error?: HttpError, data?: T) {
    this.message = message;
    this.error = error;
    this.data = data;
  }

  static ok<T = any>(data?: T, message?: string): HttpResponse<T> {
    return new HttpResponse(message || MessageType.SUCCESS, undefined, data);
  }

  static error(
    name: string,
    errorMap: Record<string, Record<string, any>>,
    extra?: {
      msgParams?: Record<string, string | number | boolean>;
    },
  ): HttpException {
    const errorConfig = get(errorMap, name);

    if (!errorConfig) {
      return new HttpException(
        new HttpResponse(
          'common.undefinedError',
          {
            name: 'common.undefinedError',
            message: `error type '${name}' is undefined`,
          },
          undefined,
        ),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }

    const { status, message: errorMessage } = errorConfig;
    const error: HttpError = { name, message: errorMessage };

    // replace {{param}} in error message with value
    if (extra?.msgParams) {
      const matchArr = error.message.match(/{{(.*?)}}/g) || [];
      // remove "{{" and "}}" in matchArr
      const params = matchArr.map((key) => key.slice(2, key.length - 2));

      params.forEach((param) => {
        if (extra.msgParams && extra.msgParams[param] !== undefined) {
          error.message = error.message.replace(
            `{{${param}}}`,
            String(extra.msgParams[param]),
          );
        }
      });
    }

    const message = name;

    return new HttpException(
      new HttpResponse(message, error, undefined),
      status,
    );
  }

  static transformValidatorError(errors: ValidationError[]): HttpException {
    const { status } = commonErrorMap.validation.validationFailed;
    const firstError = errors[0];
    const firstConstraint = Object.keys(firstError.constraints as any)[0];

    const errorName = `${firstError.property}.${firstConstraint}`;
    const errorMessage = firstError.constraints[firstConstraint] as string;

    const message = `validation.${errorName}`;

    return new HttpException(
      new HttpResponse(message, {
        name: errorName,
        message: errorMessage,
      }),
      status,
    );
  }

  static customError(
    message: MessageType,
    httpCode: number,
    error: HttpError,
  ): HttpException {
    return new HttpException(
      new HttpResponse(message, error, undefined),
      httpCode,
    );
  }
}
