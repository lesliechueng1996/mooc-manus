import { searchPageReqSchema } from '@repo/api-schema';
import { z } from 'zod';

export const createDatasetReqSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name should be less than 100 characters' }),
  description: z
    .string()
    .max(2000, { message: 'Description should be less than 2000 characters' }),
  icon: z.url({ message: 'Icon should be a url' }),
});

export const getDatasetListReqSchema = searchPageReqSchema;

export const deleteDatasetReqSchema = z.object({
  datasetId: z.string(),
});

export const updateDatasetReqSchema = z.object({
  datasetId: z.string(),
  name: z
    .string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name should be less than 100 characters' }),
  description: z
    .string()
    .max(2000, { message: 'Description should be less than 2000 characters' }),
  icon: z.url({ message: 'Icon should be a url' }),
});
