import type { AgentConfig, LlmConfig } from '@/domain/models/app-config';
import {
  loadByUserId,
  saveAppConfig,
} from '@/domain/repository/app-config-repository';

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
