import { getRotatingFileSink } from '@logtape/file';
import {
  configure,
  getConsoleSink,
  getLogger as getLogtapeLogger,
} from '@logtape/logtape';

let loggerName = 'mooc-manus-api';

export type LogLevel = 'debug' | 'info' | 'warning' | 'error';

export const createUILoggerConfiguration = (logLevel: LogLevel = 'debug') => {
  loggerName = 'mooc-manus-ui';
  return configure({
    sinks: {
      console: getConsoleSink(),
      file: getRotatingFileSink('mooc-manus-ui.log', {
        maxSize: 1024 * 1024 * 5,
        maxFiles: 5,
      }),
    },
    loggers: [
      {
        category: 'mooc-manus-ui',
        lowestLevel: logLevel,
        sinks: ['console', 'file'],
      },
    ],
  });
};

export const createAPILoggerConfiguration = (logLevel: LogLevel = 'debug') => {
  loggerName = 'mooc-manus-api';
  return configure({
    sinks: {
      console: getConsoleSink(),
      file: getRotatingFileSink('mooc-manus-api.log', {
        maxSize: 1024 * 1024 * 5,
        maxFiles: 5,
      }),
    },
    loggers: [
      {
        category: 'mooc-manus-api',
        lowestLevel: logLevel,
        sinks: ['console', 'file'],
      },
    ],
  });
};

export const getLogger = () => {
  return getLogtapeLogger(loggerName);
};
