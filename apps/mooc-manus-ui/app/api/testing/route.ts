import {
  createBullmqQueue,
  DOCUMENT_QUEUE_NAME,
  DATASET_QUEUE_NAME,
  BUILD_DOCUMENTS_TASK_NAME,
  DELETE_DATASET_TASK_NAME,
} from '@repo/bullmq-task';

const documentQueue = createBullmqQueue(DOCUMENT_QUEUE_NAME);
const datasetQueue = createBullmqQueue(DATASET_QUEUE_NAME);

export const GET = async () => {
  await documentQueue.add(
    BUILD_DOCUMENTS_TASK_NAME,
    {
      name: BUILD_DOCUMENTS_TASK_NAME,
      data: {
        requestId: '123',
        userId: '123',
        documentIds: ['123'],
        datasetId: '123',
      },
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
    },
  );

  await datasetQueue.add(
    DELETE_DATASET_TASK_NAME,
    {
      name: DELETE_DATASET_TASK_NAME,
      data: {
        requestId: '123',
        userId: '123',
        datasetId: '123',
      },
    },
    {
      removeOnComplete: true,
      removeOnFail: true,
    },
  );

  return new Response('Hello, world!');
};
