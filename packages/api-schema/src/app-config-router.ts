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
