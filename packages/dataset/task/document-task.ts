import {
  BUILD_DOCUMENTS_TASK_NAME,
  type BuildDocumentsTaskData,
  createBullmqQueue,
  DOCUMENT_QUEUE_NAME,
  type Queue,
} from '@repo/bullmq-task';
import { getLogger } from '@repo/common';

let documentQueue: Queue | null = null;

const getDocumentQueue = () => {
  if (documentQueue) {
    return documentQueue;
  }
  documentQueue = createBullmqQueue(DOCUMENT_QUEUE_NAME);
  return documentQueue;
};

export const buildDocumentsAyncTask = async (
  data: Omit<BuildDocumentsTaskData, 'taskName'>,
) => {
  const logger = getLogger();
  logger.info('Building documents async task');

  return getDocumentQueue().add(
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
