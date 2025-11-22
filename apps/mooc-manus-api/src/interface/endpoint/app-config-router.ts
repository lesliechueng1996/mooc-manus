import {
  createSuccessResponse,
  updateAgentConfigRequestSchema,
  updateLlmConfigRequestSchema,
} from '@repo/api-schema';
import {
  getAgentConfig,
  getLlmConfig,
  updateAgentConfig,
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

appConfigRouter.get('/agent', async (c) => {
  const agentConfig = await getAgentConfig(c.var.userId);
  return c.json(createSuccessResponse(agentConfig));
});

appConfigRouter.put(
  '/agent',
  zValidator('json', updateAgentConfigRequestSchema),
  async (c) => {
    const agentConfig = c.req.valid('json');
    const updatedAgentConfig = await updateAgentConfig(
      c.var.userId,
      agentConfig,
    );
    return c.json(createSuccessResponse(updatedAgentConfig));
  },
);

export default appConfigRouter;
