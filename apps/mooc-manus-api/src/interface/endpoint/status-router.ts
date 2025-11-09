import { createSuccessResponse } from '@repo/api-schema';
import { createApiRouter } from './router.js';

const statusRouter = createApiRouter();

statusRouter.get('/', (c) => {
  return c.json(createSuccessResponse({}));
});

export default statusRouter;
