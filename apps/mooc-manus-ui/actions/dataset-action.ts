'use server';

import { authActionClient } from '@/lib/safe-action';
import { createDatasetReqSchema } from '@/schemas/dataset-schema';
import { createDataset } from '@/services/dataset-service';

export const createDatasetAction = authActionClient
  .inputSchema(createDatasetReqSchema)
  .metadata({
    actionName: 'createDataset',
  })
  .action(async ({ parsedInput, ctx: { userId } }) => {
    const dataset = await createDataset({ userId, ...parsedInput });
    return dataset.id;
  });
