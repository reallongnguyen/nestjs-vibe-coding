import { Module, Provider } from '@nestjs/common';
import { LoggerModule as PinoLoggerModule, Logger } from 'nestjs-pino';
import { join } from 'path';
import { DestinationStream } from 'pino';
import { Options } from 'pino-http';
import { PrettyOptions } from 'pino-pretty';
import { ConfigService } from '@nestjs/config';
import { LOGGER_TOKEN } from './logger.token';

const getPinoHttpOptions = (
  options,
):
  | Options
  | DestinationStream
  | [opts: Options, stream: DestinationStream] => ({
  level: options.level,
  transport:
    process.env.NODE_ENV !== 'production'
      ? {
          target: join(__dirname, 'pino-pretty-transport'),
          options: {
            colorize: true,
          } as PrettyOptions,
        }
      : undefined,
  customLogLevel: (_req, res, err) => {
    if (res.statusCode >= 400 && res.statusCode < 500) {
      return 'warn';
    }
    if (res.statusCode >= 500 || err) {
      return 'error';
    }
    if (res.statusCode >= 300 && res.statusCode < 400) {
      return 'silent';
    }
    return 'info';
  },
  customReceivedMessage: (req) => `Request received: ${req.method} ${req.url}`,
  customSuccessMessage: (req, res) => {
    if (res.statusCode === 404) {
      return `Resource not found on request ${req.method} ${req.url}`;
    }
    return `Request ${req.method} ${req.url} completed with status code: ${res.statusCode}`;
  },
  customErrorMessage: (req, res) => {
    return `Request ${req.method} ${req.url} errored with status code: ${res.statusCode}`;
  },
  customAttributeKeys: {
    req: 'request',
    res: 'response',
    err: 'error',
  },
});

const loggerProvider: Provider = {
  provide: LOGGER_TOKEN,
  useExisting: Logger,
};

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        pinoHttp: getPinoHttpOptions({ level: configService.get('logLevel') }),
      }),
    }),
  ],
  providers: [loggerProvider],
  exports: [loggerProvider],
})
export class LoggerModule {}
