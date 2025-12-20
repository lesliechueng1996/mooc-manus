import z from 'zod';
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
