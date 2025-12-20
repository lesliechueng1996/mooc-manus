import { AppConfigService } from '@/application/services/app-config-service';
import { createSuccessResponse } from '@repo/common';
import { Elysia } from 'elysia';
import { logger as loggerPlugin } from '../plugin/logger';
import { userId } from '../plugin/user-id';
import {
  getAgentConfigResponseSchema,
  getLlmConfigResponseSchema,
  updateAgentConfigRequestSchema,
  updateAgentConfigResponseSchema,
  updateLlmConfigRequestSchema,
  updateLlmConfigResponseSchema,
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
  );
