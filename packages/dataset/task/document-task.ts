import {
  BUILD_DOCUMENTS_TASK_NAME,
  type BuildDocumentsTaskData,
  createBullmqQueue,
  DOCUMENT_QUEUE_NAME,
} from '@repo/bullmq-task';
import { getLogger } from '@repo/common';

const documentQueue = createBullmqQueue(DOCUMENT_QUEUE_NAME);

export const buildDocumentsAyncTask = async (
  data: Omit<BuildDocumentsTaskData, 'taskName'>,
) => {
  const logger = getLogger();
  logger.info('Building documents async task');

  return documentQueue.add(
    BUILD_DOCUMENTS_TASK_NAME,
    {
      name: BUILD_DOCUMENTS_TASK_NAME,
      data: { ...data, taskName: BUILD_DOCUMENTS_TASK_NAME },
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
    },
  );
};
