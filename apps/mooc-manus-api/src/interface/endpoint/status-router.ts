import { createResponse, createSuccessResponse } from '@repo/api-schema';
import { checkAll } from '@/application/services/status-service.js';
import { createApiRouter } from './router.js';

const statusRouter = createApiRouter();

statusRouter.get('/', async (c) => {
  const status = await checkAll();
  if (status.some((s) => s.status === 'error')) {
    return c.json(createResponse(503, 'Service is not available', status));
  }
  return c.json(createSuccessResponse(status));
});

export default statusRouter;
