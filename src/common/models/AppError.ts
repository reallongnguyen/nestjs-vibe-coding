export class AppError extends Error {
  name: string;
  msgParams: Record<string, string | number | boolean>;

  constructor(
    name: string,
    msgParams?: Record<string, string | number | boolean>,
  ) {
    super(name);
    this.name = name;
    this.msgParams = msgParams || {};

    // Capture stack trace
    Error.captureStackTrace(this, this.constructor);
  }
}
