import {
  createSuccessResponse,
  updateAgentConfigRequestSchema,
  updateLlmConfigRequestSchema,
  updateMcpServerEnabledRequestSchema,
  updateMcpServersRequestSchema,
} from '@repo/api-schema';
import {
  deleteMcpServer,
  getAgentConfig,
  getLlmConfig,
  setMcpServerEnabled,
  updateAgentConfig,
  updateLlmConfig,
  updateOrCreateMcpServers,
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

// appConfigRouter.get('/mcp-servers', async (c) => {
//   // TODO: Implement
// });

appConfigRouter.post(
  '/mcp-servers',
  zValidator('json', updateMcpServersRequestSchema),
  async (c) => {
    const updateMcpServersRequest = c.req.valid('json');
    await updateOrCreateMcpServers(c.var.userId, updateMcpServersRequest);
    return c.json(createSuccessResponse());
  },
);

appConfigRouter.delete('/mcp-servers/:serverName', async (c) => {
  const serverName = c.req.param('serverName');
  await deleteMcpServer(c.var.userId, serverName);
  return c.json(createSuccessResponse());
});

appConfigRouter.patch(
  '/mcp-servers/:serverName/enabled',
  zValidator('json', updateMcpServerEnabledRequestSchema),
  async (c) => {
    const serverName = c.req.param('serverName');
    const updateMcpServerEnabledRequest = c.req.valid('json');
    await setMcpServerEnabled(
      c.var.userId,
      serverName,
      updateMcpServerEnabledRequest.enabled,
    );
    return c.json(createSuccessResponse());
  },
);

export default appConfigRouter;
