import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { requestId } from 'hono/request-id';
import { logger } from './infrasturcture/logging/index.js';
import type { Logger } from 'pino';

type Variables = {
  requestId: string;
  logger: Logger;
};

const app = new Hono<{ Variables: Variables }>();
app.use(requestId());
app.use(logger);

app.get('/', (c) => {
  c.var.logger.info('Hello Hono!');
  c.var.logger.error('Hello Hono!!!');
  return c.text('Hello Hono!');
});

serve(
  {
    fetch: app.fetch,
    port: 3000,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  },
);
