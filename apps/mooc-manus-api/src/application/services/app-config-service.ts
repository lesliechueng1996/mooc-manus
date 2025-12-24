import { NotFoundException } from '@repo/common';
import type {
  AgentConfig,
  LlmConfig,
  McpConfig,
  McpTransport,
} from '@/domain/model/app-config';
import type { AppConfigRepository } from '@/domain/repository/app-config-repository';
import { McpClientManager } from '@/domain/services/tools/mcp';
import type { Logger } from '@/infrastructure/logging';
import { DbAppConfigRepository } from '@/infrastructure/repository/db-app-config-repository';

export type ListMcpServerItem = {
  serverName: string;
  enabled: boolean;
  transport: McpTransport;
  tools: Array<string>;
};

export class AppConfigService {
  private readonly appConfigRepository: AppConfigRepository;

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
    await McpClientManager.clearCache(userId, { logger: this.logger });
    return appConfig.mcpConfig;
  }

  async deleteMcpServer(userId: string, serverName: string) {
    const appConfig = await this.loadAppConfig(userId);
    if (!appConfig.mcpConfig.mcpServers[serverName]) {
      throw new NotFoundException(`MCP server ${serverName} not found`);
    }
    delete appConfig.mcpConfig.mcpServers[serverName];
    await this.appConfigRepository.saveAppConfig(userId, appConfig);
    await McpClientManager.clearCache(userId);
    return appConfig.mcpConfig;
  }

  async setMcpServerEnabled(
    userId: string,
    serverName: string,
    enabled: boolean,
  ) {
    const appConfig = await this.loadAppConfig(userId);
    if (!appConfig.mcpConfig.mcpServers[serverName]) {
      throw new NotFoundException(`MCP server ${serverName} not found`);
    }
    appConfig.mcpConfig.mcpServers[serverName].enabled = enabled;
    await this.appConfigRepository.saveAppConfig(userId, appConfig);
    await McpClientManager.clearCache(userId);
    return appConfig.mcpConfig;
  }

  async getMcpServers(userId: string) {
    const appConfig = await this.loadAppConfig(userId);
    const mcpClientManager = new McpClientManager(
      appConfig.mcpConfig,
      userId,
      this.logger,
    );

    const mcpServers: Array<ListMcpServerItem> = [];

    try {
      await mcpClientManager.initialize();
      const tools = mcpClientManager.tools;

      for (const [serverName, serverConfig] of Object.entries(
        appConfig.mcpConfig.mcpServers,
      )) {
        mcpServers.push({
          serverName,
          enabled: serverConfig.enabled,
          transport: serverConfig.transport,
          tools: tools.get(serverName)?.map((tool) => tool.name) ?? [],
        });
      }

      return mcpServers;
    } finally {
      mcpClientManager.cleanUp();
    }
  }
}
