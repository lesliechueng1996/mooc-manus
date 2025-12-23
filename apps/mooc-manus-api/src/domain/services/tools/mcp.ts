import { Client as McpClient } from '@modelcontextprotocol/sdk/client/index';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp';
import type { Tool } from '@modelcontextprotocol/sdk/types';
import { NotFoundException } from '@repo/common';
import {
  type McpConfig,
  type McpServerConfig,
  type McpServerHttpConfig,
  type McpServerStdioConfig,
  McpTransport,
} from '@/domain/model/app-config';
import type { ToolResult } from '@/domain/model/tool-result';
import type { Logger } from '@/infrastructure/logging';
import { RedisClient } from '@/infrastructure/storage/redis';
import { type BaseTool, ToolCollection, type ToolSchema } from './base';

export class McpClientManager {
  private readonly mcpConfig: McpConfig;
  private readonly userId: string;
  private readonly clients: Map<string, McpClient>;
  private readonly logger: Logger;
  private readonly redisClient: RedisClient;

  private initialized: boolean;

  readonly tools: Map<string, Array<Tool>>;

  constructor(mcpConfig: McpConfig, userId: string, logger: Logger) {
    this.mcpConfig = mcpConfig;
    this.userId = userId;
    this.clients = new Map();
    this.tools = new Map();
    this.initialized = false;
    this.logger = logger;
    this.redisClient = new RedisClient(logger);
  }

  private getCacheKey(): string {
    return McpClientManager.getCacheKey(this.userId);
  }

  static getCacheKey(userId: string): string {
    return `mcp:tools:user:${userId}`;
  }

  static async clearCache(userId: string, options?: { logger: Logger }) {
    try {
      const cacheKey = McpClientManager.getCacheKey(userId);
      await RedisClient.del(cacheKey);
    } catch (error) {
      options?.logger?.error(`Failed to clear MCP cache for user ${userId}`, {
        error,
      });
    }
  }

  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      this.logger.info(
        `Found ${Object.keys(this.mcpConfig.mcpServers).length} MCP servers`,
      );

      const cacheKey = this.getCacheKey();
      const cachedTools = await this.redisClient.get(cacheKey);

      if (cachedTools) {
        try {
          const toolsMap = JSON.parse(cachedTools);
          for (const [serverName, tools] of Object.entries(toolsMap)) {
            this.tools.set(serverName, tools as Array<Tool>);
          }
          this.logger.info(
            `Restored MCP tools for user ${this.userId} from cache`,
          );
        } catch (error) {
          this.logger.error(
            `Failed to parse cached tools for user ${this.userId}`,
            { error },
          );
          await this.connectMcpServers();
          await this.cacheToolsToRedis();
        }
      } else {
        await this.connectMcpServers();
        await this.cacheToolsToRedis();
      }

      this.initialized = true;
      this.logger.info('MCP clients initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize MCP clients', { error });
      throw error;
    }
  }

  private async cacheToolsToRedis() {
    try {
      const cacheKey = this.getCacheKey();
      const toolsObj = Object.fromEntries(this.tools);
      // Cache for 24 hours, but will be invalidated on config update
      await this.redisClient.setex(cacheKey, 86400, JSON.stringify(toolsObj));
    } catch (error) {
      this.logger.error('Failed to cache MCP tools to Redis', { error });
    }
  }

  async connectMcpServers() {
    for (const [serverName, serverConfig] of Object.entries(
      this.mcpConfig.mcpServers,
    )) {
      try {
        await this.connectMcpServer(serverName, serverConfig);
      } catch (error) {
        this.logger.error(`Failed to connect to MCP server ${serverName}`, {
          error,
        });
      }
    }
  }

  async connectMcpServer(serverName: string, serverConfig: McpServerConfig) {
    try {
      const transport = serverConfig.transport;
      if (transport === McpTransport.STDIO) {
        await this.connectMcpServerStdio(serverName, serverConfig);
      } else if (transport === McpTransport.SSE) {
        await this.connectMcpServerSse(serverName, serverConfig);
      } else if (transport === McpTransport.STREAMABLE_HTTP) {
        await this.connectMcpServerStreamableHttp(serverName, serverConfig);
      } else {
        throw new Error(
          `Unsupported MCP transport: ${transport} in server ${serverName}`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to connect to MCP server ${serverName}`, {
        error,
      });
      throw error;
    }
  }

  async connectMcpServerStdio(
    serverName: string,
    serverConfig: McpServerStdioConfig,
  ) {
    const command = serverConfig.command;
    const args = serverConfig.args;
    const env = serverConfig.env;

    if (!command) {
      throw new Error(`Command is required for MCP server ${serverName}`);
    }

    const mergedEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        mergedEnv[key] = value;
      }
    }
    if (env) {
      for (const [key, value] of Object.entries(env)) {
        if (value !== undefined) {
          mergedEnv[key] = value;
        }
      }
    }

    try {
      const stdioTransport = new StdioClientTransport({
        command,
        args,
        env: mergedEnv,
      });
      const mcp = new McpClient({
        name: serverName,
        version: '1.0.0',
      });
      await mcp.connect(stdioTransport);
      this.clients.set(serverName, mcp);

      await this.cacheMcpServerTools(serverName, mcp);
      this.logger.info(`Connected to MCP server ${serverName} successfully`);
    } catch (error) {
      this.logger.error(`Failed to create stdio MCP client for ${serverName}`, {
        error,
      });
      throw error;
    }
  }

  async connectMcpServerSse(
    serverName: string,
    serverConfig: McpServerHttpConfig,
  ) {
    const url = serverConfig.url;
    const headers = serverConfig.headers;

    if (!url) {
      throw new Error(`URL is required for MCP server ${serverName}`);
    }

    try {
      const sseTransport = new SSEClientTransport(new URL(url), {
        requestInit: {
          headers: new Headers(headers ?? {}),
        },
      });
      const mcp = new McpClient({
        name: serverName,
        version: '1.0.0',
      });
      await mcp.connect(sseTransport);
      this.clients.set(serverName, mcp);

      await this.cacheMcpServerTools(serverName, mcp);
      this.logger.info(`Connected to MCP server ${serverName} successfully`);
    } catch (error) {
      this.logger.error(`Failed to create SSE MCP client for ${serverName}`, {
        error,
      });
      throw error;
    }
  }

  async connectMcpServerStreamableHttp(
    serverName: string,
    serverConfig: McpServerHttpConfig,
  ) {
    const url = serverConfig.url;
    const headers = serverConfig.headers;

    if (!url) {
      throw new Error(`URL is required for MCP server ${serverName}`);
    }

    try {
      const streamableHttpTransport = new StreamableHTTPClientTransport(
        new URL(url),
        {
          requestInit: {
            headers: new Headers(headers ?? {}),
          },
        },
      );
      const mcp = new McpClient({
        name: serverName,
        version: '1.0.0',
      });
      await mcp.connect(streamableHttpTransport);
      this.clients.set(serverName, mcp);

      await this.cacheMcpServerTools(serverName, mcp);
      this.logger.info(`Connected to MCP server ${serverName} successfully`);
    } catch (error) {
      this.logger.error(
        `Failed to create Streamable HTTP MCP client for ${serverName}`,
        { error },
      );
      throw error;
    }
  }

  async cacheMcpServerTools(serverName: string, mcp: McpClient) {
    try {
      const toolsResponse = await mcp.listTools();
      const tools = toolsResponse.tools;
      this.tools.set(serverName, tools);
      this.logger.info(
        `Cached ${tools.length} tools for MCP server ${serverName}`,
      );
    } catch (error) {
      this.logger.error(`Failed to cache MCP server tools for ${serverName}`, {
        error,
      });
      this.tools.set(serverName, []);
    }
  }

  getAllTools() {
    const allTools: ToolSchema[] = [];

    for (const [serverName, tools] of this.tools.entries()) {
      for (const tool of tools) {
        let toolName = `${serverName}_${tool.name}`;
        if (!toolName.startsWith('mcp_')) {
          toolName = `mcp_${toolName}`;
        }

        const toolSchema = {
          type: 'function',
          function: {
            name: toolName,
            description: `[${serverName}] ${tool.description || tool.name}`,
            parameters: tool.inputSchema,
          },
        };

        allTools.push(toolSchema as ToolSchema);
      }
    }

    return allTools;
  }

  async invoke<TArg extends Record<string, unknown>>(
    toolName: string,
    args: TArg,
  ): Promise<ToolResult<string>> {
    try {
      let originalServerName: string | null = null;
      let originalToolName: string | null = null;

      for (const serverName of this.clients.keys()) {
        let expectPrefix = `${serverName}_`;
        if (!serverName.startsWith('mcp_')) {
          expectPrefix = `mcp_${expectPrefix}`;
        }

        if (toolName.startsWith(expectPrefix)) {
          originalServerName = serverName;
          originalToolName = toolName.slice(expectPrefix.length);
          break;
        }
      }

      if (!originalServerName || !originalToolName) {
        throw new NotFoundException(`MCP tool ${toolName} not found`);
      }

      let mcp = this.clients.get(originalServerName);

      // Lazy load connection if not present but config exists (e.g. restored from cache)
      if (!mcp) {
        const serverConfig = this.mcpConfig.mcpServers[originalServerName];
        if (serverConfig) {
          this.logger.info(
            `Lazy connecting to MCP server ${originalServerName}...`,
          );
          await this.connectMcpServer(originalServerName, serverConfig);
          mcp = this.clients.get(originalServerName);
        }
      }

      if (!mcp) {
        throw new NotFoundException(
          `MCP client for ${originalServerName} not connected`,
        );
      }

      const result = await mcp.callTool({
        name: originalToolName,
        arguments: args,
      });

      return {
        success: true,
        message: 'Tool invoked successfully',
        data: result.content as string,
      };
    } catch (error) {
      this.logger.error(`Failed to invoke MCP tool ${toolName}`, { error });
      return {
        success: false,
        message: `Failed to invoke MCP tool ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  cleanUp() {
    try {
      this.clients.clear();
      this.tools.clear();
      this.initialized = false;
      this.logger.info('MCP clients cleaned up successfully');
    } catch (error) {
      this.logger.error('Failed to clean up MCP clients', { error });
    }
  }
}

export class McpToolCollection extends ToolCollection {
  private readonly mcpClientManager: McpClientManager;
  private toolSchemas: ToolSchema[] = [];

  constructor(logger: Logger, mcpConfig: McpConfig, userId: string) {
    super('mcp_tools');
    this.mcpClientManager = new McpClientManager(mcpConfig, userId, logger);
  }

  async initialize() {
    await this.mcpClientManager.initialize();
    this.toolSchemas = this.mcpClientManager.getAllTools();
  }

  getTools(): BaseTool[] {
    return this.toolSchemas.map((toolSchema) => ({
      toolName: toolSchema.function.name,
      toolDescription: toolSchema.function.description,
      toolSchema: toolSchema,
    }));
  }

  hasTool(toolName: string): boolean {
    return this.toolSchemas.some(
      (toolSchema) => toolSchema.function.name === toolName,
    );
  }

  async invokeTool<TArg extends Record<string, unknown>, TRes>(
    toolName: string,
    parameters: TArg,
  ): Promise<ToolResult<TRes>> {
    const result = await this.mcpClientManager.invoke(toolName, parameters);
    return result as ToolResult<TRes>;
  }
}
