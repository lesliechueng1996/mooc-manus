import { UnauthorizedException } from '@repo/common';
import { Elysia } from 'elysia';
import { logger as loggerPlugin } from './logger';

export const userId = new Elysia({ name: 'userId' })
  .use(loggerPlugin)
  .derive(({ headers, logger }) => {
    const userId = headers['X-User-Id'];

    if (!userId) {
      logger.error('User ID is required');
      throw new UnauthorizedException('User ID is required');
    }

    logger.setUserId(userId);

    return {
      userId,
    };
  })
  .as('scoped');
