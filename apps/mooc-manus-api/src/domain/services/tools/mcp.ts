import { Client as McpClient } from '@modelcontextprotocol/sdk/client';
import { SSEClientTransport } from '@modelcontextprotocol/sdk/client/sse.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';
import type { Logger } from '@repo/pino-log';
import { NotFoundException } from '@/application/error/exception';
import {
  type McpConfig,
  type McpServerConfig,
  type McpServerHttpConfig,
  type McpServerStdioConfig,
  McpTransport,
} from '@/domain/models/app-config';
import type { ToolResult } from '@/domain/models/tool-result';
import { getContextLogger } from '@/infrasturcture/logging';
import type { ToolSchema } from './base';

export class McpClientManager {
  private readonly mcpConfig: McpConfig;
  private readonly clients: Map<string, McpClient>;
  private readonly tools: Map<string, Array<Tool>>;
  private readonly logger: Logger;

  private initialized: boolean;

  constructor(mcpConfig: McpConfig) {
    this.mcpConfig = mcpConfig;
    this.clients = new Map();
    this.tools = new Map();
    this.initialized = false;
    this.logger = getContextLogger();
  }

  async initialize() {
    if (this.initialized) {
      return;
    }

    try {
      this.logger.info(
        `Found ${Object.keys(this.mcpConfig.mcpServers).length} MCP servers`,
      );
      await this.connectMcpServers();
      this.initialized = true;
      this.logger.info('MCP clients initialized successfully');
    } catch (error) {
      this.logger.error(error, 'Failed to initialize MCP clients');
      throw error;
    }
  }

  async connectMcpServers() {
    for (const [serverName, serverConfig] of Object.entries(
      this.mcpConfig.mcpServers,
    )) {
      try {
        await this.connectMcpServer(serverName, serverConfig);
      } catch (error) {
        this.logger.error(
          error,
          `Failed to connect to MCP server ${serverName}`,
        );
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
      this.logger.error(error, `Failed to connect to MCP server ${serverName}`);
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
      this.logger.error(
        error,
        `Failed to create stdio MCP client for ${serverName}`,
      );
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
      this.logger.error(
        error,
        `Failed to create SSE MCP client for ${serverName}`,
      );
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
        error,
        `Failed to create Streamable HTTP MCP client for ${serverName}`,
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
      this.logger.error(
        error,
        `Failed to cache MCP server tools for ${serverName}`,
      );
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

  async invoke(
    toolName: string,
    args: Record<string, unknown>,
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

      const mcp = this.clients.get(originalServerName);
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
      this.logger.error(error, `Failed to invoke MCP tool ${toolName}`);
      return {
        success: false,
        message: `Failed to invoke MCP tool ${toolName}: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async cleanUp() {
    try {
      this.clients.clear();
      this.tools.clear();
      this.initialized = false;
      this.logger.info('MCP clients cleaned up successfully');
    } catch (error) {
      this.logger.error(error, 'Failed to clean up MCP clients');
    }
  }
}
