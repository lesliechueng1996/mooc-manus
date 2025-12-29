import { Elysia } from 'elysia';
import {
  isExpandEnabled,
  isTimeoutActive,
  SupervisorService,
} from '@/service/supervisor';
import { logger as loggerPlugin } from './logger';

const ignorePaths = [
  '/api/supervisor/activate-timeout',
  '/api/supervisor/extend-timeout',
  '/api/supervisor/cancel-timeout',
  '/api/supervisor/timeout-status',
];

export const keepAlive = new Elysia({ name: 'keepAlive' })
  .use(loggerPlugin)
  .onBeforeHandle(async ({ path, logger }) => {
    if (
      !!process.env.SERVER_TIMEOUT_MINUTES &&
      isTimeoutActive() &&
      path.startsWith('/api') &&
      !ignorePaths.some((ignorePath) => path.startsWith(ignorePath)) &&
      isExpandEnabled()
    ) {
      try {
        const supervisorService = new SupervisorService(logger);
        await supervisorService.extendTimeout(3);
        logger.info(
          'Automatically extended timeout by 3 minutes because of keep-alive.',
        );
      } catch (error) {
        logger.error('Failed to extend timeout because of keep-alive.', {
          error,
        });
      }
    }
  })
  .as('scoped');
