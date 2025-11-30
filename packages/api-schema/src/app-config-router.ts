import { z } from 'zod';

export type GetLlmConfigResponse = {
  baseUrl: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
};

export const updateLlmConfigRequestSchema = z.object({
  baseUrl: z.url(),
  apiKey: z.string(),
  modelName: z.string(),
  temperature: z.number().min(-1).max(1),
  maxTokens: z.int().min(0),
});

export type UpdateLlmConfigRequest = z.infer<
  typeof updateLlmConfigRequestSchema
>;

export type UpdateLlmConfigResponse = {
  baseUrl: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
};

export const updateAgentConfigRequestSchema = z.object({
  maxIterations: z.int().min(0).max(1000),
  maxRetries: z.int().min(1).max(10),
  maxSearchResults: z.int().min(1).max(30),
});

export type UpdateAgentConfigRequest = z.infer<
  typeof updateAgentConfigRequestSchema
>;

export type UpdateAgentConfigResponse = {
  maxIterations: number;
  maxRetries: number;
  maxSearchResults: number;
};

enum McpTransport {
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
const mcpServerConfigSchemaBase = z.discriminatedUnion('transport', [
  mcpServerStdioSchema,
  mcpServerHttpSchema,
]);

// Add default transport as stdio when transport is missing
export const mcpServerConfigSchema = z.preprocess((data) => {
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

export type UpdateMcpServersRequest = z.infer<
  typeof updateMcpServersRequestSchema
>;

export const updateMcpServerEnabledRequestSchema = z.object({
  enabled: z.boolean(),
});

export type UpdateMcpServerEnabledRequest = z.infer<
  typeof updateMcpServerEnabledRequestSchema
>;
