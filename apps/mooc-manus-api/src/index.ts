import { serve } from '@hono/node-server';
import { contextStorage } from 'hono/context-storage';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { NotFoundException } from './application/error/exception';
import { PuppeteerBingSearch } from './infrasturcture/external/search/puppeteer-bing-search';
import { logger, loggerMiddleware } from './infrasturcture/logging/index';
import { connectCos, destroyCosClient } from './infrasturcture/storage/cos';
import { connectRedis, disconnectRedis } from './infrasturcture/storage/redis';
import appConfigRouter from './interface/endpoint/app-config-router';
import { createApiRouter } from './interface/endpoint/router';
import statusRouter from './interface/endpoint/status-router';
import { exceptionHandler } from './interface/error/exception-handler';
import { userIdMiddleware } from './interface/middleware/user-id-middleware';

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
  // const messageQueue = createRedisStreamMessageQueue('test');
  // await messageQueue.put({ data: 'test' });
  // const message = await messageQueue.pop();
  // c.var.logger.info(`message: ${JSON.stringify(message)}`);
  const bingSearch = new PuppeteerBingSearch();
  const result = await bingSearch.search('小米股价', 'past_month');
  console.log(result);

  if (result.success && result.data) {
    for (const item of result.data.results) {
      console.log(item.url, item.title, item.snippet);
    }
  }
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
