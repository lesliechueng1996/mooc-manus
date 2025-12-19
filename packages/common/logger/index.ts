import { getRotatingFileSink } from '@logtape/file';
import {
  configure,
  getConsoleSink,
  getLogger as getLogtapeLogger,
} from '@logtape/logtape';

let loggerName = 'mooc-manus-api';

export const createUILoggerConfiguration = () => {
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
        lowestLevel: 'debug',
        sinks: ['console', 'file'],
      },
    ],
  });
};

export const createAPILoggerConfiguration = () => {
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
        lowestLevel: 'debug',
        sinks: ['console', 'file'],
      },
    ],
  });
};

export const getLogger = () => {
  return getLogtapeLogger(loggerName);
};
