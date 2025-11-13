import { z } from 'zod';

export const llmConfigSchema = z.object({
  baseUrl: z.url().default('https://api.deepseek.com'),
  apiKey: z.string().default(''),
  modelName: z.string().default('deepseek-reasoner'),
  temperature: z.number().min(-1).max(1).default(0.7),
  maxTokens: z.int().min(0).default(8192),
});

export type LlmConfig = z.infer<typeof llmConfigSchema>;

export const appConfigSchema = z.object({
  llmConfig: llmConfigSchema.default(llmConfigSchema.parse({})),
});

export type AppConfig = z.infer<typeof appConfigSchema>;
