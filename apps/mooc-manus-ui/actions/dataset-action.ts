'use server';

import { authActionClient } from '@/lib/safe-action';
import {
  createDatasetReqSchema,
  deleteDatasetReqSchema,
  getDatasetListReqSchema,
  updateDatasetReqSchema,
} from '@/schemas/dataset-schema';
import {
  createDataset,
  deleteDataset,
  listDatasetsByPage,
  updateDataset,
} from '@/services/dataset-service';

export const createDatasetAction = authActionClient
  .inputSchema(createDatasetReqSchema)
  .metadata({
    actionName: 'createDataset',
  })
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const dataset = await createDataset({ userId, ...parsedInput });
    return dataset.id;
  });

export const fetchDatasetsByPageAction = authActionClient
  .inputSchema(getDatasetListReqSchema)
  .metadata({
    actionName: 'fetchDatasetsByPage',
  })
  .action(async ({ parsedInput, ctx: { userId } }) =>
    listDatasetsByPage(userId, parsedInput),
  );

export const deleteDatasetAction = authActionClient
  .inputSchema(deleteDatasetReqSchema)
  .metadata({
    actionName: 'deleteDataset',
  })
  .action(async ({ parsedInput, ctx: { userId } }) => {
    return await deleteDataset(parsedInput.datasetId, userId);
  });

export const updateDatasetAction = authActionClient
  .inputSchema(updateDatasetReqSchema)
  .metadata({
    actionName: 'updateDataset',
  })
  .action(async ({ parsedInput, ctx: { userId } }) => {
    await updateDataset(parsedInput.datasetId, userId, parsedInput);
    return parsedInput.datasetId;
  });
