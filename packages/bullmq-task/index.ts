import { type Processor, Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';

const globalForBullmq = globalThis as unknown as {
  redisConnection?: IORedis;
  queues: Map<string, Queue>;
};

if (!globalForBullmq.queues) {
  globalForBullmq.queues = new Map();
}

export const initBullmqConnection = (options?: {
  host: string;
  port: number;
  db: number;
}) => {
  if (globalForBullmq.redisConnection) {
    return globalForBullmq.redisConnection;
  }

  const { host, port, db } = options || {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_QUEUE_DB || '0', 10),
  };

  globalForBullmq.redisConnection = new IORedis({
    host,
    port,
    db,
    maxRetriesPerRequest: null,
  });

  return globalForBullmq.redisConnection;
};

export const createBullmqQueue = (
  name: string,
  options?: Parameters<typeof initBullmqConnection>[0],
) => {
  if (globalForBullmq.queues.has(name)) {
    return globalForBullmq.queues.get(name) as Queue;
  }

  const connection = initBullmqConnection(options);

  const queue = new Queue(name, {
    connection,
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForBullmq.queues.set(name, queue);
  }

  return queue;
};

export const createBullmqWorker = <DataType, ResultType>(
  name: string,
  processor: Processor<DataType, ResultType>,
  options?: Parameters<typeof createBullmqQueue>[1],
) => {
  const connection = initBullmqConnection(options);

  return new Worker<DataType, ResultType>(name, processor, {
    connection,
    removeOnComplete: { count: 0 },
    removeOnFail: { count: 0 },
    concurrency: 1,
  });
};

export type { Queue, Worker } from 'bullmq';
export * from './constant';
export * from './types';
