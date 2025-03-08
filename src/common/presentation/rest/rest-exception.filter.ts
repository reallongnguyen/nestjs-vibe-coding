import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from '../../models/AppError';

import RestResponse from './RestResponse';

@Catch(AppError, HttpException, Error)
export class RestExceptionFilter implements ExceptionFilter {
  errorMap: Record<string, Record<string, any>>;
  logger: Logger;

  constructor(errorMap: Record<string, Record<string, any>>) {
    this.errorMap = errorMap;
    this.logger = new Logger();
  }

  catch(exception: AppError | HttpException | Error, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle standard HTTP exceptions
    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());

      return;
    }

    // Handle application-specific errors
    if (exception instanceof AppError) {
      const appError = exception;
      const formattedError = RestResponse.error(appError.name, this.errorMap, {
        msgParams: appError.msgParams,
      });

      response
        .status(formattedError.getStatus())
        .json(formattedError.getResponse());

      return;
    }

    // Handle unexpected errors
    const unexpectedError = RestResponse.error(
      'common.serverError',
      this.errorMap,
    );

    this.logger.error(exception.stack);

    response
      .status(unexpectedError.getStatus())
      .json(unexpectedError.getResponse());
  }
}
