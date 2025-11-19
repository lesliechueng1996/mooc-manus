import { createLoggerConfig, getLogger } from '@repo/pino-log';
import { pinoHttp } from '@repo/pino-log/pino-http';
import { getContext } from 'hono/context-storage';
import { createMiddleware } from 'hono/factory';
import { env } from '@/config/env';
import type { Env } from '@/type';

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

export const getContextLogger = () => {
  return getContext<Env>().var.logger;
};
