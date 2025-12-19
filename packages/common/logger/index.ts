import {
  configure,
  getConsoleSink,
  getLogger as getLogtapeLogger,
} from '@logtape/logtape';
import { getRotatingFileSink } from '@logtape/file';

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

export const getLogger = () => {
  return getLogtapeLogger(loggerName);
};
