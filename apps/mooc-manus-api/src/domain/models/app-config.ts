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

export const appConfigSchema = z.object({
  llmConfig: llmConfigSchema.default(llmConfigSchema.parse({})),
  agentConfig: agentConfigSchema.default(agentConfigSchema.parse({})),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
