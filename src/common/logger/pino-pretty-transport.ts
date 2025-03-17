/* eslint-disable import/no-import-module-exports */
import PinoPretty, { PrettyOptions } from 'pino-pretty';
import { red, gray, green, blue, yellow } from 'colors';

const levelPrettifier = (logLevel) => {
  let levelColorize: string;
  let rightPad = '';
  switch (logLevel) {
    case 10:
      levelColorize = gray('TRACE');
      break;
    case 20:
      levelColorize = green('DEBUG');
      break;
    case 40:
      levelColorize = yellow('WARN');
      rightPad = ' ';
      break;
    case 50:
      levelColorize = red('ERROR');
      break;
    default:
      levelColorize = blue('INFO');
      rightPad = ' ';
  }
  const baseLevelLog = `${gray('[')}${levelColorize}${gray(']')}${rightPad}`;
  return baseLevelLog;
};

module.exports = (opts: PrettyOptions) =>
  PinoPretty({
    ...opts,
    levelFirst: true,
    // hideObject: true,
    translateTime: 'UTC:dd.mm.yyyy, h:MM:ss TT Z',
    customPrettifiers: {
      time: (timestamp: any) => `🕰  ${timestamp}`,
      level: levelPrettifier,
      pid: (pid) => red(pid as string),
      responseTime: (timestamp: any) => `⏱ ${timestamp / 1000}s`,
    },
    ignore: 'context,hostname,request,response',
    messageFormat: (log) => {
      const message = (log.msg ?? '') as string;
      switch (log.level) {
        case 10:
          return gray(message);
        case 20:
          return green(message);
        case 40:
          return yellow(message);
        case 50:
          return red(message);
        default:
          return blue(message);
      }
    },
  });
