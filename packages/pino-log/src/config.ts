import type { Options } from 'pino-http';
import { createLogger } from './logger.js';

export const createLoggerConfig = (logLevel: string) => {
  const logger = createLogger(logLevel);
  const loggerConfig: Options = {
    useLevel: logLevel,
    autoLogging: true,
    logger,
    customReceivedMessage: (req) => {
      return `Request received: [${req.method}] ${req.url}`;
    },
    customSuccessMessage: (req, res) => {
      return `Response sent: [${req.method}] ${req.url} - ${res.statusCode} ${res.statusMessage}`;
    },
    customErrorMessage: (req, res, err) => {
      return `Error occurred: [${req.method}] ${req.url} - [${res.statusCode}] ${res.statusMessage} - ${err.message}`;
    },
  };

  return loggerConfig;
};
