import { z } from 'zod';

export const llmConfigSchema = z.object({
  baseUrl: z.url().default('https://api.deepseek.com'),
  apiKey: z.string().default(''),
  modelName: z.string().default('deepseek-reasoner'),
  temperature: z.number().min(-1).max(1).default(0.7),
  maxTokens: z.int().min(0).default(8192),
});

export type LlmConfig = z.infer<typeof llmConfigSchema>;

export const agentConfigSchema = z.object({
  maxIterations: z.int().min(0).max(1000).default(100),
  maxRetries: z.int().min(1).max(10).default(3),
  maxSearchResults: z.int().min(1).max(30).default(10),
});

export type AgentConfig = z.infer<typeof agentConfigSchema>;

export enum McpTransport {
  STDIO = 'stdio',
  SSE = 'sse',
  STREAMABLE_HTTP = 'streamable_http',
}

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
export const mcpServerConfigSchema = z.discriminatedUnion('transport', [
  mcpServerStdioSchema,
  mcpServerHttpSchema,
]);

export type McpServerConfig = z.infer<typeof mcpServerConfigSchema>;

export type McpServerStdioConfig = z.infer<typeof mcpServerStdioSchema>;

export type McpServerHttpConfig = z.infer<typeof mcpServerHttpSchema>;

export const mcpConfigSchema = z.object({
  mcpServers: z.record(z.string(), mcpServerConfigSchema).default({}),
});

export type McpConfig = z.infer<typeof mcpConfigSchema>;

export const appConfigSchema = z.object({
  llmConfig: llmConfigSchema.default(llmConfigSchema.parse({})),
  agentConfig: agentConfigSchema.default(agentConfigSchema.parse({})),
  mcpConfig: mcpConfigSchema.default(mcpConfigSchema.parse({})),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
