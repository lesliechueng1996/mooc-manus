import { serve } from '@hono/node-server';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { NotFoundException } from './application/error/exception.js';
import { logger, loggerMiddleware } from './infrasturcture/logging/index.js';
import { connectCos, destroyCosClient } from './infrasturcture/storage/cos.js';
import {
  connectRedis,
  disconnectRedis,
} from './infrasturcture/storage/redis.js';
import appConfigRouter from './interface/endpoint/app-config-router.js';
import { createApiRouter } from './interface/endpoint/router.js';
import statusRouter from './interface/endpoint/status-router.js';
import { exceptionHandler } from './interface/error/exception-handler.js';
import { userIdMiddleware } from './interface/middleware/user-id-middleware.js';

const app = createApiRouter();

app.use(requestId());
app.use(loggerMiddleware);
app.use(userIdMiddleware);
app.use(contextStorage());
app.use(
  '/api/*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD'],
    allowHeaders: ['*'],
    credentials: true,
  }),
);
app.notFound(() => {
  throw new NotFoundException();
});
app.onError(exceptionHandler);

app.get('/', async (c) => {
  c.var.logger.info('Hello Hono!');
  c.var.logger.error('Hello Hono!!!');
  return c.text('Hello Hono!');
});

const apiRouter = createApiRouter();

apiRouter.route('/status', statusRouter);
apiRouter.route('/app-config', appConfigRouter);

app.route('/api', apiRouter);

await connectRedis();
connectCos();

serve(
  {
    fetch: app.fetch,
    port: 8000,
  },
  (info) => {
    logger.info(`Server is running on http://localhost:${info.port}`);
  },
);

process.on('SIGINT', async () => {
  await disconnectRedis();
  destroyCosClient();
  process.exit(0);
});
