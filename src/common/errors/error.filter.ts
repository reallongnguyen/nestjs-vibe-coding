import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { AppError } from './app.error';

@Catch()
export class GlobalErrorFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalErrorFilter.name);

  catch(error: Error, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Handle AppError
    if (error instanceof AppError) {
      this.logger.error(error.message, error.toJSON());
      response.status(error.status).json({
        code: error.code,
        message: error.message,
        params: error.params,
        timestamp: error.timestamp.toISOString(),
      });
      return;
    }

    // Handle NestJS HttpException
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const errorResponse = error.getResponse();

      this.logger.error(error.message, { status, response: errorResponse });
      response.status(status).json({
        code: 'http.error',
        message: error.message,
        params:
          typeof errorResponse === 'object'
            ? errorResponse
            : { message: errorResponse },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Handle unknown errors
    this.logger.error('Unhandled error', error);
    response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      code: 'internal.error',
      message: 'Internal server error',
      timestamp: new Date().toISOString(),
    });
  }
}
