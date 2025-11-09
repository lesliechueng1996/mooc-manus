import { createErrorResponse } from '@repo/api-schema';
import type { ErrorHandler } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { AppException } from '@/application/error/exception.js';
import type { Context } from '@/type.js';

export const exceptionHandler: ErrorHandler<Context> = (err, c) => {
  const logger = c.var.logger;

  if (err instanceof AppException) {
    logger.error(err, 'App error occurred');
    return c.json(
      createErrorResponse(err.getCode(), err.getMsg()),
      err.getStatusCode(),
    );
  }

  if (err instanceof HTTPException) {
    logger.error(err, 'HTTP error occurred');
    return c.json(createErrorResponse(err.status, err.message), err.status);
  }

  logger.error(err, 'Unhandled error occurred');
  return c.json(createErrorResponse(500, 'Internal server error'), 500);
};
