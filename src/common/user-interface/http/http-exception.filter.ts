import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from 'src/common/models/AppError';
import HttpResponse from './HttpResponse';

@Catch(AppError, HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  errorMap: Record<string, Record<string, any>>;

  constructor(errorMap: Record<string, Record<string, any>>) {
    this.errorMap = errorMap;
  }

  catch(exception: AppError | HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      response.status(exception.getStatus()).json(exception.getResponse());

      return;
    }

    const appError = exception as AppError;

    const httpException = HttpResponse.error(appError.name, this.errorMap, {
      msgParams: appError.msgParams,
    });

    response
      .status(httpException.getStatus())
      .json(httpException.getResponse());
  }
}
