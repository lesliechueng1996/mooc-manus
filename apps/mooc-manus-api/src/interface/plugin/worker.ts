import {
  type Worker as BullmqWorker,
  createBullmqWorker,
  DATASET_QUEUE_NAME,
  type DatasetTaskData,
  DOCUMENT_QUEUE_NAME,
  type DocumentTaskData,
} from '@repo/bullmq-task';
import { Elysia } from 'elysia';
import { Logger } from '@/infrastructure/logging';

const workers: BullmqWorker[] = [];
const logger = new Logger();

const createWorker = <T extends DocumentTaskData | DatasetTaskData>(
  queueName: string,
  workerPath: string,
) => {
  logger.info(`Creating ${queueName} worker...`);
  return createBullmqWorker<T, void>(queueName, async (job) => {
    const { name, data } = job;
    const { promise, resolve, reject } = Promise.withResolvers<void>();

    const thread = new Worker(workerPath);
    thread.postMessage({ name, data });
    thread.onmessage = (event) => {
      if (event.data?.success) {
        logger.info(`${queueName} worker completed`);
        resolve();
      } else {
        logger.error(`${queueName} worker failed`);
        reject(new Error(`${queueName} worker failed`));
      }
      thread.terminate();
    };
    thread.onerror = (error) => {
      logger.error(`${queueName} worker error`, { error: error.message });
      reject(error);
      thread.terminate();
    };

    return promise;
  });
};

// 使用 import.meta.url 解析 Worker 文件的绝对路径
const getWorkerPath = (relativePath: string): string => {
  return new URL(relativePath, import.meta.url).pathname;
};

export const worker = new Elysia({ name: 'worker' })
  .onStart(() => {
    logger.info('Workers starting...');
    const documentWorker = createWorker<DocumentTaskData>(
      DOCUMENT_QUEUE_NAME,
      getWorkerPath('../../worker/document-worker.ts'),
    );
    workers.push(documentWorker);

    const datasetWorker = createWorker<DatasetTaskData>(
      DATASET_QUEUE_NAME,
      getWorkerPath('../../worker/dataset-worker.ts'),
    );
    workers.push(datasetWorker);

    logger.info('All workers started');
  })
  .onStop(async () => {
    await Promise.all(workers.map((worker) => worker.close()));
    logger.info('All workers stopped');
  });
