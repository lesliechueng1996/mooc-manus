import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { NotFoundException } from './application/error/exception.js';
import { logger } from './infrasturcture/logging/index.js';
import { connectCos, destroyCosClient } from './infrasturcture/storage/cos.js';
import { databaseClient } from './infrasturcture/storage/database.js';
import {
  connectRedis,
  disconnectRedis,
} from './infrasturcture/storage/redis.js';
import { createApiRouter } from './interface/endpoint/router.js';
import statusRouter from './interface/endpoint/status-router.js';
import { exceptionHandler } from './interface/error/exception-handler.js';

const app = createApiRouter();

app.use(requestId());
app.use(logger);
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
  const demos = await databaseClient.demo.findMany();
  console.log(demos);
  c.var.logger.info('Hello Hono!');
  c.var.logger.error('Hello Hono!!!');
  return c.text('Hello Hono!');
});

const apiRouter = createApiRouter();

apiRouter.route('/status', statusRouter);

app.route('/api', apiRouter);

await connectRedis();
connectCos();

serve(
  {
    fetch: app.fetch,
    port: 8000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);

process.on('SIGINT', async () => {
  await disconnectRedis();
  destroyCosClient();
  process.exit(0);
});
