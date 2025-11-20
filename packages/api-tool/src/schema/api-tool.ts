import { searchPageReqSchema } from '@repo/api-schema';
import { z } from 'zod';

export const createApiToolReqSchema = z.object({
  name: z
    .string({ message: 'Tool name should be a string' })
    .min(1, { message: 'Tool name is required' })
    .max(30, { message: 'Tool name should be less than 30 characters' }),
  icon: z.url({ message: 'Tool icon should be a url' }),
  openapiSchema: z.string({ message: 'openapiSchema should be a string' }),
  headers: z.array(
    z.object({
      key: z.string({ message: 'Header key should be a string' }),
      value: z.string({ message: 'Header value should be a string' }),
    }),
  ),
});

export type CreateApiToolReq = z.infer<typeof createApiToolReqSchema>;

export const getApiToolListReqSchema = searchPageReqSchema;

export type GetApiToolListRes = {
  id: string;
  name: string;
  icon: string;
  description: string;
  headers: Record<string, string>[];
  createdAt: number;
  tools: {
    id: string;
    name: string;
    description: string;
    inputs: {
      name: string;
      type: string;
      description: string;
      required: boolean;
    }[];
  }[];
};

export type GetApiToolProviderRes = {
  id: string;
  name: string;
  icon: string;
  description: string;
  openapiSchema: string;
  headers: { key: string; value: string }[];
  createdAt: number;
};

export const updateApiToolReqSchema = z.object({
  name: z
    .string({ message: 'Tool name should be a string' })
    .min(1, { message: 'Tool name is required' })
    .max(30, { message: 'Tool name should be less than 30 characters' }),
  icon: z.url({ message: 'Tool icon should be a url' }),
  openapiSchema: z.string({ message: 'openapiSchema should be a string' }),
  headers: z.array(
    z.object({
      key: z.string({ message: 'Header key should be a string' }),
      value: z.string({ message: 'Header value should be a string' }),
    }),
  ),
});

export type UpdateApiToolReq = z.infer<typeof updateApiToolReqSchema>;
