import type {
  AgentConfig,
  LlmConfig,
  McpConfig,
} from '@/domain/model/app-config';
import type { Logger } from '@/infrastructure/logging';
import { DbAppConfigRepository } from '@/infrastructure/repository/db-app-config-repository';

export class AppConfigService {
  private readonly appConfigRepository: DbAppConfigRepository;

  constructor(private readonly logger: Logger) {
    this.appConfigRepository = new DbAppConfigRepository(this.logger);
  }

  private async loadAppConfig(userId: string) {
    return this.appConfigRepository.loadAppConfigByUserId(userId);
  }

  async getLlmConfig(userId: string) {
    const appConfig = await this.loadAppConfig(userId);
    return appConfig.llmConfig;
  }

  async updateLlmConfig(userId: string, llmConfig: LlmConfig) {
    const appConfig = await this.loadAppConfig(userId);
    if (!llmConfig.apiKey.trim()) {
      llmConfig.apiKey = appConfig.llmConfig.apiKey;
    }
    appConfig.llmConfig = llmConfig;
    await this.appConfigRepository.saveAppConfig(userId, appConfig);

    return appConfig.llmConfig;
  }

  async getAgentConfig(userId: string) {
    const appConfig = await this.loadAppConfig(userId);
    return appConfig.agentConfig;
  }

  async updateAgentConfig(userId: string, agentConfig: AgentConfig) {
    const appConfig = await this.loadAppConfig(userId);
    appConfig.agentConfig = agentConfig;
    await this.appConfigRepository.saveAppConfig(userId, appConfig);
    return appConfig.agentConfig;
  }

  async updateOrCreateMcpServers(userId: string, mcpServerConfig: McpConfig) {
    const appConfig = await this.loadAppConfig(userId);
    appConfig.mcpConfig = {
      mcpServers: {
        ...appConfig.mcpConfig.mcpServers,
        ...mcpServerConfig.mcpServers,
      },
    };
    await this.appConfigRepository.saveAppConfig(userId, appConfig);
    // TODO: clear MCP cache
    // await McpClientManager.clearCache(userId);
    return appConfig.mcpConfig;
  }
}
