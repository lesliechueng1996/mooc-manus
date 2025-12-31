import {
  BUILD_DOCUMENTS_TASK_NAME,
  createBullmqQueue,
  DOCUMENT_QUEUE_NAME,
} from '@repo/bullmq-task';
import { getLogger } from '@repo/common';

const documentQueue = createBullmqQueue(DOCUMENT_QUEUE_NAME);

export const buildDocumentsAyncTask = (
  datasetId: string,
  documentIds: string[],
) => {
  const logger = getLogger();
  logger.info('Building documents async task');

  return documentQueue.add(
    BUILD_DOCUMENTS_TASK_NAME,
    {
      name: BUILD_DOCUMENTS_TASK_NAME,
      data: {
        datasetId,
        documentIds,
      },
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
};
