/// <reference lib="webworker" />

import type { DocumentTaskData } from '@repo/bullmq-task';
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
    data: DocumentTaskData;
  }>,
) => {
  try {
    const { name, data } = event.data;
    logger.info('Document worker received message, {name}, {data}', {
      name,
      data,
    });
    console.log(process.env.LOG_LEVEL);
    console.log(process.env.DATABASE_URL);
    self.postMessage({ success: true });
  } catch (error) {
    logger.error('Document worker error', { error });
    self.postMessage({ success: false });
  }
};
