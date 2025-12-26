import { createSuccessResponse } from '@repo/common';
import { Elysia } from 'elysia';
import { FileService } from '@/service/file';
import { logger as loggerPlugin } from '../plugin/logger';
import {
  readFileRequestSchema,
  readFileResponseSchema,
  writeFileRequestSchema,
  writeFileResponseSchema,
} from '../schema/file';

export const fileRouter = new Elysia({
  name: 'file-router',
  prefix: '/file',
  tags: ['File'],
})
  .use(loggerPlugin)
  .post(
    '/read-file',
    async ({ logger, body }) => {
      const { filepath, startLine, endLine, sudo, maxLength } = body;
      const fileService = new FileService(logger);
      const result = await fileService.readFile(
        filepath,
        startLine,
        endLine,
        sudo,
        maxLength,
      );
      return createSuccessResponse(result);
    },
    {
      body: readFileRequestSchema,
      response: {
        200: readFileResponseSchema,
      },
      detail: {
        summary: 'Read file content',
      },
    },
  )
  .post(
    '/write-file',
    async ({ logger, body }) => {
      const {
        filepath,
        content,
        append,
        leadingNewline,
        trailingNewline,
        sudo,
      } = body;
      const fileService = new FileService(logger);
      const result = await fileService.writeFile(
        filepath,
        content,
        append,
        leadingNewline,
        trailingNewline,
        sudo,
      );
      return createSuccessResponse(result);
    },
    {
      body: writeFileRequestSchema,
      response: {
        200: writeFileResponseSchema,
      },
      detail: {
        summary: 'Write file content',
      },
    },
  );
