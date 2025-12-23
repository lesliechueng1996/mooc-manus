import z from 'zod';
import { McpTransport } from '@/domain/model/app-config';
import { createSuccessResponseSchema } from './common';

export const getLlmConfigResponseSchema = createSuccessResponseSchema(
  z.object({
    baseUrl: z
      .string()
      .describe('The base URL of the LLM Model')
      .default('https://api.deepseek.com'),
    modelName: z
      .string()
      .describe('The name of the LLM Model')
      .default('deepseek-reasoner'),
    temperature: z
      .number()
      .describe('The temperature of the LLM Model')
      .default(0.7),
    maxTokens: z
      .number()
      .describe('The maximum number of tokens the LLM Model can generate')
      .default(8192),
  }),
);

export const updateLlmConfigRequestSchema = z.object({
  baseUrl: z.url().describe('The base URL of the LLM Model'),
  apiKey: z.string().describe('The API key of the LLM Model'),
  modelName: z.string().describe('The name of the LLM Model'),
  temperature: z
    .number()
    .min(-1)
    .max(1)
    .describe('The temperature of the LLM Model'),
  maxTokens: z
    .int()
    .min(0)
    .max(128000)
    .describe('The maximum number of tokens the LLM Model can generate'),
});

export const updateLlmConfigResponseSchema = createSuccessResponseSchema(
  z.object({
    baseUrl: z
      .string()
      .describe('The base URL of the LLM Model')
      .default('https://api.deepseek.com'),
    modelName: z
      .string()
      .describe('The name of the LLM Model')
      .default('deepseek-reasoner'),
    temperature: z
      .number()
      .describe('The temperature of the LLM Model')
      .default(0.7),
    maxTokens: z
      .number()
      .describe('The maximum number of tokens the LLM Model can generate')
      .default(8192),
  }),
);

export const getAgentConfigResponseSchema = createSuccessResponseSchema(
  z.object({
    maxIterations: z
      .int()
      .describe('The maximum number of iterations the Agent can perform')
      .default(100),
    maxRetries: z
      .int()
      .describe('The maximum number of retries the Agent can perform')
      .default(3),
    maxSearchResults: z
      .int()
      .describe('The maximum number of search results the Agent can return')
      .default(10),
  }),
);

export const updateAgentConfigRequestSchema = z.object({
  maxIterations: z
    .int()
    .min(0)
    .max(1000)
    .describe('The maximum number of iterations the Agent can perform'),
  maxRetries: z
    .int()
    .min(1)
    .max(10)
    .describe('The maximum number of retries the Agent can perform'),
  maxSearchResults: z
    .int()
    .min(1)
    .max(30)
    .describe('The maximum number of search results the Agent can return'),
});

export const updateAgentConfigResponseSchema = createSuccessResponseSchema(
  z.object({
    maxIterations: z
      .int()
      .describe('The maximum number of iterations the Agent can perform')
      .default(100),
    maxRetries: z
      .int()
      .describe('The maximum number of retries the Agent can perform')
      .default(3),
    maxSearchResults: z
      .int()
      .describe('The maximum number of search results the Agent can return')
      .default(10),
  }),
);

export const getMcpServersResponseSchema = createSuccessResponseSchema(
  z.object({
    mcpServers: z.array(
      z.object({
        serverName: z.string().describe('The name of the MCP server'),
        enabled: z.boolean().describe('Whether the MCP server is enabled'),
        transport: z
          .string()
          .describe(
            'The transport of the MCP server, one of stdio, sse, streamable_http',
          ),
        tools: z.array(z.string()).describe('The tools of the MCP server'),
      }),
    ),
  }),
);

// Base schema with common fields
const mcpServerBaseSchema = z.object({
  enabled: z.boolean().default(true),
  description: z.string().nullable().default(null),
  env: z.record(z.string(), z.string()).nullable().default(null),
});

// Schema for stdio transport
const mcpServerStdioSchema = mcpServerBaseSchema.extend({
  transport: z.literal(McpTransport.STDIO),
  command: z.string(),
  args: z.array(z.string()),
});

// Schema for HTTP-based transports (sse, streamable_http)
const mcpServerHttpSchema = mcpServerBaseSchema.extend({
  transport: z.enum([McpTransport.SSE, McpTransport.STREAMABLE_HTTP]),
  url: z.url(),
  headers: z.record(z.string(), z.string()).nullable().default(null),
});

// Combined schema using discriminated union
const mcpServerConfigSchemaBase = z.discriminatedUnion('transport', [
  mcpServerStdioSchema,
  mcpServerHttpSchema,
]);

// Add default transport as stdio when transport is missing
const mcpServerConfigSchema = z.preprocess((data) => {
  if (
    data &&
    typeof data === 'object' &&
    !Array.isArray(data) &&
    !('transport' in data)
  ) {
    return { ...data, transport: McpTransport.STREAMABLE_HTTP };
  }
  return data;
}, mcpServerConfigSchemaBase);

export const updateMcpServersRequestSchema = z.object({
  mcpServers: z.record(z.string(), mcpServerConfigSchema).default({}),
});

export const updateMcpServersResponseSchema = createSuccessResponseSchema(
  z.object({}),
);

export const deleteMcpServerRequestSchema = z.object({
  serverName: z.string().describe('The name of the MCP server to delete'),
});

export const deleteMcpServerResponseSchema = createSuccessResponseSchema(
  z.object({}),
);

export const updateMcpServerEnabledRequestBodySchema = z.object({
  enabled: z.boolean().describe('Whether the MCP server is enabled'),
});

export const updateMcpServerEnabledRequestParamchema = z.object({
  serverName: z.string().describe('The name of the MCP server to delete'),
});

export const updateMcpServerEnabledResponseSchema = createSuccessResponseSchema(
  z.object({}),
);
