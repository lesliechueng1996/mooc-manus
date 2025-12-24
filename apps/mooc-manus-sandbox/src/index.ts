import openapi, { fromTypes } from '@elysiajs/openapi';
import {
  createSandboxLoggerConfiguration,
  getLogger,
  type LogLevel,
} from '@repo/common';
import { Elysia } from 'elysia';
import { z } from 'zod';
import { fileRouter } from './interface/endpoint/file-router';
import { shellRouter } from './interface/endpoint/shell-router';
import { supervisorRouter } from './interface/endpoint/supervisor';

await createSandboxLoggerConfiguration(process.env.LOG_LEVEL as LogLevel);
const logger = getLogger();

const app = new Elysia()
  .get('/', () => 'Hello Elysia')
  .use(supervisorRouter)
  .use(fileRouter)
  .use(shellRouter)
  .use(
    openapi({
      references: fromTypes(),
      mapJsonSchema: {
        zod: z.toJSONSchema,
      },
      documentation: {
        info: {
          title: 'Mooc Manus Sandbox',
          version: '1.0.0',
          description: 'Mooc Manus Sandbox',
        },
      },
    }),
  )
  .listen(8081);

logger.info(
  `🦊 Mooc Manus Sandbox is running at ${app.server?.hostname}:${app.server?.port}`,
);
