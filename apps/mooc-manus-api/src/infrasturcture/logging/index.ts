import { createMiddleware } from 'hono/factory';
import { pinoHttp, type Options } from 'pino-http';
import { env } from '@/config/env.js';

const loggerConfig: Options = {
  useLevel: env.logLevel,
  autoLogging: true,
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      ignore: 'req,res',
      messageFormat: '{req.id} - {msg}',
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l',
    },
  },
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

export const logger = createMiddleware(async (c, next) => {
  c.env.incoming.id = c.var.requestId;
  await new Promise<void>((resolve) =>
    pinoHttp(loggerConfig)(c.env.incoming, c.env.outgoing, () => resolve()),
  );

  c.set('logger', c.env.incoming.log);
  await next();
});
