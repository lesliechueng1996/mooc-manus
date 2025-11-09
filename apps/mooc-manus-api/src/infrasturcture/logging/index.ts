import { createLoggerConfig, getLogger, pinoHttp } from '@repo/pino-log';
import { createMiddleware } from 'hono/factory';
import { env } from '@/config/env.js';

const loggerConfig = createLoggerConfig(env.logLevel);

export const loggerMiddleware = createMiddleware(async (c, next) => {
  c.env.incoming.id = c.var.requestId;
  await new Promise<void>((resolve) =>
    pinoHttp(loggerConfig)(c.env.incoming, c.env.outgoing, () => resolve()),
  );

  c.set('logger', c.env.incoming.log);
  await next();
});

export const logger = getLogger();
