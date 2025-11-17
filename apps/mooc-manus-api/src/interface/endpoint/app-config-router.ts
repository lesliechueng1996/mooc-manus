import {
  createSuccessResponse,
  updateLlmConfigRequestSchema,
} from '@repo/api-schema';
import {
  getLlmConfig,
  updateLlmConfig,
} from '@/application/services/app-config-service';
import { createApiRouter } from './router';
import { zValidator } from './validator';

const appConfigRouter = createApiRouter();

appConfigRouter.get('/llm', async (c) => {
  const llmConfig = await getLlmConfig(c.var.userId);
  const { apiKey: _apiKey, ...configWithoutApiKey } = llmConfig;
  return c.json(createSuccessResponse(configWithoutApiKey));
});

appConfigRouter.put(
  '/llm',
  zValidator('json', updateLlmConfigRequestSchema),
  async (c) => {
    const llmConfig = c.req.valid('json');
    const updatedLlmConfig = await updateLlmConfig(c.var.userId, llmConfig);
    const { apiKey: _apiKey, ...configWithoutApiKey } = updatedLlmConfig;
    return c.json(createSuccessResponse(configWithoutApiKey));
  },
);

export default appConfigRouter;
