/// <reference lib="webworker" />

import type { DatasetTaskData } from '@repo/bullmq-task';
import {
  createAPILoggerConfiguration,
  getLogger,
  type LogLevel,
} from '@repo/common';

await createAPILoggerConfiguration(
  (process.env.LOG_LEVEL as LogLevel) || 'debug',
);
const logger = getLogger();

self.onmessage = async (
  event: MessageEvent<{
    name: string;
    data: DatasetTaskData;
  }>,
) => {
  try {
    const { name, data } = event.data;
    logger.info('Dataset worker received message', { name, data });
    console.log(process.env.LOG_LEVEL);
    console.log(process.env.DATABASE_URL);
    self.postMessage({ success: true });
  } catch (error) {
    logger.error('Dataset worker error', { error });
    self.postMessage({ success: false });
  }
};
