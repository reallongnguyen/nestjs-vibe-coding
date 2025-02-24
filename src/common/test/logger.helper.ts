/* eslint-disable @typescript-eslint/no-unsafe-function-type */
import { Logger } from '@nestjs/common';

export class LoggerHelper {
  private originalLogMethods: Partial<Record<keyof Logger, Function>>;
  private logSpy: jest.SpyInstance;

  constructor() {
    this.originalLogMethods = {};
  }

  setupLoggerSpy() {
    // Store original methods
    this.originalLogMethods = {
      debug: Logger.prototype.debug,
      error: Logger.prototype.error,
      warn: Logger.prototype.warn,
    };

    // Create spy
    this.logSpy = jest.spyOn(Logger.prototype, 'error');
    jest.spyOn(Logger.prototype, 'debug');
    jest.spyOn(Logger.prototype, 'warn');
  }

  restoreLogger() {
    // Restore original methods
    Object.entries(this.originalLogMethods).forEach(([method, impl]) => {
      Logger.prototype[method] = impl as any;
    });
    this.logSpy?.mockRestore();
  }

  getLoggerCalls() {
    return {
      debug: (Logger.prototype.debug as jest.Mock).mock.calls,
      error: (Logger.prototype.error as jest.Mock).mock.calls,
      warn: (Logger.prototype.warn as jest.Mock).mock.calls,
    };
  }
}
