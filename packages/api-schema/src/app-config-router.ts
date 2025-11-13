import { z } from 'zod';

export type GetLlmConfigResponse = {
  baseUrl: string;
  modelName: string;
  temperature: number;
  maxTokens: number;
};

export const updateLlmConfigRequestSchema = z.object({
  baseUrl: z.url().default('https://api.deepseek.com'),
  apiKey: z.string().default(''),
  modelName: z.string().default('deepseek-reasoner'),
  temperature: z.number().min(-1).max(1).default(0.7),
  maxTokens: z.int().min(0).default(8192),
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
