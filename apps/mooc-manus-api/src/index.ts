import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { requestId } from 'hono/request-id';
import { logger } from './infrasturcture/logging/index.js';
import { createApiRouter } from './interface/endpoint/router.js';
import statusRouter from './interface/endpoint/status-router.js';
import { exceptionHandler } from './interface/error/exception-handler.js';
import { NotFoundException } from './application/error/exception.js';

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

app.get('/', (c) => {
  c.var.logger.info('Hello Hono!');
  c.var.logger.error('Hello Hono!!!');
  return c.text('Hello Hono!');
});

const apiRouter = createApiRouter();
apiRouter.route('/status', statusRouter);

app.route('/api', apiRouter);

serve(
  {
    fetch: app.fetch,
    port: 8000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
