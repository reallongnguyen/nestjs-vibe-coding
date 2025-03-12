import { HttpStatus } from '@nestjs/common';

export interface ErrorDefinition {
  message: string;
  status: HttpStatus;
}

export interface ErrorOptions {
  params?: Record<string, unknown>;
  cause?: Error;
}

export class AppError extends Error {
  readonly code: string;
  readonly status: HttpStatus;
  readonly params: Record<string, unknown>;
  readonly cause?: Error;
  readonly timestamp: Date;

  constructor(
    code: string,
    definition: ErrorDefinition,
    options: ErrorOptions = {},
  ) {
    super();
    this.name = this.constructor.name;
    this.code = code;
    this.status = definition.status;
    this.message = this.formatMessage(definition.message, options.params || {});
    this.params = options.params || {};
    this.cause = options.cause;
    this.timestamp = new Date();

    Error.captureStackTrace(this, this.constructor);
  }

  private formatMessage(
    message: string,
    params: Record<string, unknown>,
  ): string {
    return message.replace(/\{(\w+)\}/g, (_, key) =>
      String(params[key] ?? `{${key}}`),
    );
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      params: this.params,
      timestamp: this.timestamp.toISOString(),
    };
  }
}
