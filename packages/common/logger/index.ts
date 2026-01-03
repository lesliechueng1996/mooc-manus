import { getRotatingFileSink } from '@logtape/file';
import {
  configure,
  getConsoleSink,
  getLogger as getLogtapeLogger,
} from '@logtape/logtape';
import { getPrettyFormatter } from '@logtape/pretty';
import type { LogLevel } from './type';

export * from './type';

let loggerName = 'mooc-manus-api';

export const createUILoggerConfiguration = (logLevel: LogLevel = 'debug') => {
  loggerName = 'mooc-manus-ui';
  return configure({
    sinks: {
      console: getConsoleSink({
        formatter: getPrettyFormatter({
          timestamp: 'date-time-tz',
        }),
      }),
      file: getRotatingFileSink('mooc-manus-ui.log', {
        maxSize: 1024 * 1024 * 5,
        maxFiles: 5,
      }),
      // Independent sink for meta logger (optional, for logging logging system's own errors)
      metaFile: getRotatingFileSink('mooc-manus-ui-meta.log', {
        maxSize: 1024 * 1024 * 5,
        maxFiles: 3,
      }),
    },
    loggers: [
      {
        category: 'mooc-manus-ui',
        lowestLevel: logLevel.toLowerCase() as LogLevel,
        sinks: ['console', 'file'],
      },
      // Configure meta logger: hide info messages, only log warnings and errors
      {
        category: ['logtape', 'meta'],
        lowestLevel: 'warning', // Set to 'warning' or 'error' to hide info-level messages
        sinks: ['metaFile'], // Optional: output meta logs to a separate file
      },
    ],
  });
};

export const createAPILoggerConfiguration = (logLevel: LogLevel = 'debug') => {
  loggerName = 'mooc-manus-api';
  return configure({
    sinks: {
      console: getConsoleSink({
        formatter: getPrettyFormatter({
          timestamp: 'date-time-tz',
        }),
      }),
      file: getRotatingFileSink('mooc-manus-api.log', {
        maxSize: 1024 * 1024 * 5,
        maxFiles: 5,
      }),
      // Independent sink for meta logger (optional, for logging logging system's own errors)
      metaFile: getRotatingFileSink('mooc-manus-api-meta.log', {
        maxSize: 1024 * 1024 * 5,
        maxFiles: 3,
      }),
    },
    loggers: [
      {
        category: 'mooc-manus-api',
        lowestLevel: logLevel.toLowerCase() as LogLevel,
        sinks: ['console', 'file'],
      },
      // Configure meta logger: hide info messages, only log warnings and errors
      {
        category: ['logtape', 'meta'],
        lowestLevel: 'warning', // Set to 'warning' or 'error' to hide info-level messages
        sinks: ['metaFile'], // Optional: output meta logs to a separate file
      },
    ],
  });
};

export const createSandboxLoggerConfiguration = (
  logLevel: LogLevel = 'debug',
) => {
  loggerName = 'mooc-manus-sandbox';
  return configure({
    sinks: {
      console: getConsoleSink({
        formatter: getPrettyFormatter({
          timestamp: 'date-time-tz',
        }),
      }),
      file: getRotatingFileSink('mooc-manus-sandbox.log', {
        maxSize: 1024 * 1024 * 5,
        maxFiles: 5,
      }),
      // Independent sink for meta logger (optional, for logging logging system's own errors)
      metaFile: getRotatingFileSink('mooc-manus-sandbox-meta.log', {
        maxSize: 1024 * 1024 * 5,
        maxFiles: 3,
      }),
    },
    loggers: [
      {
        category: 'mooc-manus-sandbox',
        lowestLevel: logLevel.toLowerCase() as LogLevel,
        sinks: ['console', 'file'],
      },
      // Configure meta logger: hide info messages, only log warnings and errors
      {
        category: ['logtape', 'meta'],
        lowestLevel: 'warning', // Set to 'warning' or 'error' to hide info-level messages
        sinks: ['metaFile'], // Optional: output meta logs to a separate file
      },
    ],
  });
};

export const getLogger = () => {
  return getLogtapeLogger(loggerName);
};

export class Logger {
  private requestId: string;
  private userId: string;

  constructor(requestId: string = 'N/A', userId: string = 'N/A') {
    this.requestId = requestId;
    this.userId = userId;
  }

  private get logger() {
    return getLogger();
  }

  public setRequestId(value: string) {
    this.requestId = value;
  }

  public setUserId(value: string) {
    this.userId = value;
  }

  public info(message: string, data: Record<string, unknown> = {}) {
    this.logger.info(
      `Request ID: {requestId} - User ID: {userId} - ${message}`,
      { ...data, requestId: this.requestId, userId: this.userId },
    );
  }

  public warn(message: string, data: Record<string, unknown> = {}) {
    this.logger.warn(
      `Request ID: {requestId} - User ID: {userId} - ${message}`,
      { ...data, requestId: this.requestId, userId: this.userId },
    );
  }

  public error(message: string, data: Record<string, unknown> = {}) {
    let formattedMessage = `Request ID: {requestId} - User ID: {userId} - ${message}`;
    if ('error' in data) {
      formattedMessage += `\nError: {error}`;
    }
    this.logger.error(formattedMessage, {
      ...data,
      requestId: this.requestId,
      userId: this.userId,
    });
  }
}
