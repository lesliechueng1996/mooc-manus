import { createSuccessResponse } from '@repo/common';
import { Elysia } from 'elysia';
import { AppConfigService } from '@/application/services/app-config-service';
import { logger as loggerPlugin } from '../plugin/logger';
import { userId } from '../plugin/user-id';
import {
  deleteMcpServerRequestSchema,
  deleteMcpServerResponseSchema,
  getAgentConfigResponseSchema,
  getLlmConfigResponseSchema,
  getMcpServersResponseSchema,
  updateAgentConfigRequestSchema,
  updateAgentConfigResponseSchema,
  updateLlmConfigRequestSchema,
  updateLlmConfigResponseSchema,
  updateMcpServerEnabledRequestBodySchema,
  updateMcpServerEnabledRequestParamchema,
  updateMcpServerEnabledResponseSchema,
  updateMcpServersRequestSchema,
  updateMcpServersResponseSchema,
} from '../schema/app-config-schema';

export const appConfigRouter = new Elysia({
  prefix: '/app-config',
  tags: ['App Config'],
})
  .use(loggerPlugin)
  .use(userId)
  .get(
    '/llm',
    async ({ logger, userId }) => {
      const appConfigService = new AppConfigService(logger);
      const llmConfig = await appConfigService.getLlmConfig(userId);
      const { apiKey: _apiKey, ...configWithoutApiKey } = llmConfig;
      return createSuccessResponse(configWithoutApiKey);
    },
    {
      response: {
        200: getLlmConfigResponseSchema,
      },
      detail: {
        summary: 'Get LLM config',
      },
    },
  )
  .put(
    '/llm',
    async ({ body, userId, logger }) => {
      const appConfigService = new AppConfigService(logger);
      const updatedLlmConfig = await appConfigService.updateLlmConfig(
        userId,
        body,
      );
      const { apiKey: _apiKey, ...configWithoutApiKey } = updatedLlmConfig;
      return createSuccessResponse(configWithoutApiKey);
    },
    {
      body: updateLlmConfigRequestSchema,
      response: {
        200: updateLlmConfigResponseSchema,
      },
      detail: {
        summary: 'Update LLM config',
      },
    },
  )
  .get(
    '/agent',
    async ({ userId, logger }) => {
      const appConfigService = new AppConfigService(logger);
      const agentConfig = await appConfigService.getAgentConfig(userId);
      return createSuccessResponse(agentConfig);
    },
    {
      response: {
        200: getAgentConfigResponseSchema,
      },
      detail: {
        summary: 'Get Agent config',
      },
    },
  )
  .put(
    '/agent',
    async ({ body, userId, logger }) => {
      const appConfigService = new AppConfigService(logger);
      const updatedAgentConfig = await appConfigService.updateAgentConfig(
        userId,
        body,
      );
      return createSuccessResponse(updatedAgentConfig);
    },
    {
      body: updateAgentConfigRequestSchema,
      response: {
        200: updateAgentConfigResponseSchema,
      },
      detail: {
        summary: 'Update Agent config',
      },
    },
  )
  .get(
    '/mcp-servers',
    async ({ logger, userId }) => {
      const appConfigService = new AppConfigService(logger);
      const mcpServers = await appConfigService.getMcpServers(userId);
      return createSuccessResponse({
        mcpServers,
      });
    },
    {
      response: {
        200: getMcpServersResponseSchema,
      },
      detail: {
        summary: 'Get MCP servers',
      },
    },
  )
  .post(
    '/mcp-servers',
    async ({ body, userId, logger }) => {
      const appConfigService = new AppConfigService(logger);
      await appConfigService.updateOrCreateMcpServers(userId, body);
      return createSuccessResponse({});
    },
    {
      body: updateMcpServersRequestSchema,
      response: {
        200: updateMcpServersResponseSchema,
      },
      detail: {
        summary: 'Update or create MCP servers',
      },
    },
  )
  .delete(
    '/mcp-servers/:serverName',
    async ({ params: { serverName }, userId, logger }) => {
      const appConfigService = new AppConfigService(logger);
      await appConfigService.deleteMcpServer(userId, serverName);
      return createSuccessResponse({});
    },
    {
      params: deleteMcpServerRequestSchema,
      response: {
        200: deleteMcpServerResponseSchema,
      },
      detail: {
        summary: 'Delete MCP server',
      },
    },
  )
  .patch(
    '/mcp-servers/:serverName/enabled',
    async ({ params: { serverName }, body, userId, logger }) => {
      const appConfigService = new AppConfigService(logger);
      await appConfigService.setMcpServerEnabled(
        userId,
        serverName,
        body.enabled,
      );
      return createSuccessResponse({});
    },
    {
      params: updateMcpServerEnabledRequestParamchema,
      body: updateMcpServerEnabledRequestBodySchema,
      response: {
        200: updateMcpServerEnabledResponseSchema,
      },
      detail: {
        summary: 'Update MCP server enabled',
      },
    },
  );
