import { createSuccessResponse } from '@repo/common';
import { Elysia, file } from 'elysia';
import { FileService } from '@/service/file';
import { logger as loggerPlugin } from '../plugin/logger';
import {
  downloadFileRequestSchema,
  downloadFileResponseSchema,
  findFileRequestSchema,
  findFileResponseSchema,
  readFileRequestSchema,
  readFileResponseSchema,
  replaceInFileRequestSchema,
  replaceInFileResponseSchema,
  searchInFileRequestSchema,
  searchInFileResponseSchema,
  uploadFileRequestSchema,
  uploadFileResponseSchema,
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
  )
  .post(
    '/replace-in-file',
    async ({ logger, body }) => {
      const { filepath, oldStr, newStr, sudo } = body;
      const fileService = new FileService(logger);
      const result = await fileService.replaceInFile(
        filepath,
        oldStr,
        newStr,
        sudo,
      );
      return createSuccessResponse(result);
    },
    {
      body: replaceInFileRequestSchema,
      response: {
        200: replaceInFileResponseSchema,
      },
      detail: {
        summary: 'Replace string in file',
      },
    },
  )
  .post(
    '/search-in-file',
    async ({ logger, body }) => {
      const { filepath, regex, sudo } = body;
      const fileService = new FileService(logger);
      const result = await fileService.searchInFile(filepath, regex, sudo);
      return createSuccessResponse(result);
    },
    {
      body: searchInFileRequestSchema,
      response: {
        200: searchInFileResponseSchema,
      },
      detail: {
        summary: 'Search string in file',
      },
    },
  )
  .post(
    '/find-files',
    async ({ logger, body }) => {
      const { dirPath, globPattern } = body;
      const fileService = new FileService(logger);
      const result = await fileService.findFiles(dirPath, globPattern);
      return createSuccessResponse(result);
    },
    {
      body: findFileRequestSchema,
      response: {
        200: findFileResponseSchema,
      },
      detail: {
        summary: 'Find files',
      },
    },
  )
  .post(
    '/upload-file',
    async ({ logger, body }) => {
      const { file, filepath } = body;
      const fileService = new FileService(logger);
      const result = await fileService.uploadFile(file, filepath);
      return createSuccessResponse(result);
    },
    {
      body: uploadFileRequestSchema,
      response: {
        200: uploadFileResponseSchema,
      },
      detail: {
        summary: 'Upload file',
      },
    },
  )
  .post(
    '/download-file',
    async ({ body, logger }) => {
      const { filepath } = body;
      const fileService = new FileService(logger);
      fileService.ensureFile(filepath);
      return file(filepath);
    },
    {
      body: downloadFileRequestSchema,
      response: {
        200: downloadFileResponseSchema,
      },
      detail: {
        summary: 'Download file',
      },
    },
  );
