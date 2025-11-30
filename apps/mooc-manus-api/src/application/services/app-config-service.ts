import type {
  AgentConfig,
  LlmConfig,
  McpConfig,
} from '@/domain/models/app-config';
import {
  loadByUserId,
  saveAppConfig,
} from '@/domain/repository/app-config-repository';
import { McpClientManager } from '@/domain/services/tools/mcp';
import { NotFoundException } from '../error/exception';

const loadAppConfig = (userId: string) => loadByUserId(userId);

export const getLlmConfig = async (userId: string) => {
  const appConfig = await loadAppConfig(userId);
  return appConfig.llmConfig;
};

export const updateLlmConfig = async (userId: string, llmConfig: LlmConfig) => {
  const appConfig = await loadAppConfig(userId);
  if (!llmConfig.apiKey.trim()) {
    llmConfig.apiKey = appConfig.llmConfig.apiKey;
  }
  appConfig.llmConfig = llmConfig;
  await saveAppConfig(userId, appConfig);

  return appConfig.llmConfig;
};

export const getAgentConfig = async (userId: string) => {
  const appConfig = await loadAppConfig(userId);
  return appConfig.agentConfig;
};

export const updateAgentConfig = async (
  userId: string,
  agentConfig: AgentConfig,
) => {
  const appConfig = await loadAppConfig(userId);
  appConfig.agentConfig = agentConfig;
  await saveAppConfig(userId, appConfig);
  return appConfig.agentConfig;
};

export const updateOrCreateMcpServers = async (
  userId: string,
  mcpServerConfig: McpConfig,
) => {
  const appConfig = await loadAppConfig(userId);
  appConfig.mcpConfig = mcpServerConfig;
  await saveAppConfig(userId, appConfig);
  await McpClientManager.clearCache(userId);
  return appConfig.mcpConfig;
};

export const deleteMcpServer = async (userId: string, serverName: string) => {
  const appConfig = await loadAppConfig(userId);
  if (!appConfig.mcpConfig.mcpServers[serverName]) {
    throw new NotFoundException(`MCP server ${serverName} not found`);
  }
  delete appConfig.mcpConfig.mcpServers[serverName];
  await saveAppConfig(userId, appConfig);
  await McpClientManager.clearCache(userId);
  return appConfig.mcpConfig;
};

export const setMcpServerEnabled = async (
  userId: string,
  serverName: string,
  enabled: boolean,
) => {
  const appConfig = await loadAppConfig(userId);
  if (!appConfig.mcpConfig.mcpServers[serverName]) {
    throw new NotFoundException(`MCP server ${serverName} not found`);
  }
  appConfig.mcpConfig.mcpServers[serverName].enabled = enabled;
  await saveAppConfig(userId, appConfig);
  await McpClientManager.clearCache(userId);
  return appConfig.mcpConfig;
};
