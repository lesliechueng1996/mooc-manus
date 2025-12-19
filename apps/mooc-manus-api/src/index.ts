import { createAPILoggerConfiguration, getLogger } from '@repo/common';
import { Elysia } from 'elysia';

await createAPILoggerConfiguration();
const logger = getLogger();

const app = new Elysia()
  .get('/', () => {
    logger.info('Hello Elysia');
    return 'Hello Elysia';
  })
  .listen(3000);

logger.info(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
