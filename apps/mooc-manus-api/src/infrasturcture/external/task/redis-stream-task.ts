import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskRunner } from '@/domain/external/task';
import { getContextLogger } from '@/infrasturcture/logging/index';
import { createRedisStreamMessageQueue } from '../message-queue/redis-stream-message-queue';

const taskRegistry = new Map<string, Task>();

export const getTask = (id: string) => {
  return taskRegistry.get(id);
};

export const destroy = async () => {
  for (const task of taskRegistry.values()) {
    task.cancel();
    await task.taskRunner.destroy();
  }
  taskRegistry.clear();
};

export const createRedisStreamTask = (taskRunner: TaskRunner): Task => {
  const logger = getContextLogger();
  const id = uuidv4();
  // let executionTask: Promise<void> | null = null;
  const abortController = new AbortController();
  const inputStream = createRedisStreamMessageQueue(`task:input:${id}`);
  const outputStream = createRedisStreamMessageQueue(`task:output:${id}`);
  let done = false;
  let inProgress = false;
  let task: Task | null = null;

  const cleanupRegistry = () => {
    if (taskRegistry.has(id)) {
      logger.info(`Cleaning up task registry for task ${id}`);
      taskRegistry.delete(id);
    }
  };

  const onTaskDone = async () => {
    if (!task) {
      logger.error('Task not found');
      return;
    }
    await taskRunner.onDone(task);
    cleanupRegistry();
  };

  const executeTask = async () => {
    const { resolve, reject, promise } = Promise.withResolvers<void>();

    const onAbort = () => {
      logger.error('Task cancelled');
      reject(new Error('Task cancelled'));
    };

    const resultPromise = promise.finally(() => {
      abortController.signal.removeEventListener('abort', onAbort);
      done = true;
      inProgress = false;
      onTaskDone().catch((error) => {
        logger.error(error, `Failed to execute onTaskDone for task ${id}`);
      });
    });

    if (!task) {
      logger.error('Task not found');
      reject(new Error('Task not found'));
      return resultPromise;
    }

    if (abortController.signal.aborted) {
      onAbort();
      return resultPromise;
    }

    abortController.signal.addEventListener('abort', onAbort);

    taskRunner.invoke(task).then(resolve).catch(reject);

    return resultPromise;
  };

  const invoke: Task['invoke'] = () => {
    if (!done && !inProgress) {
      inProgress = true;
      executeTask();
      logger.info(`Executing task ${id}`);
    }
  };

  const cancel: Task['cancel'] = () => {
    if (!done) {
      abortController.abort();
      logger.info(`Cancelled task ${id}`);
    }
    cleanupRegistry();
    return true;
  };

  task = {
    id,
    inputStream,
    outputStream,
    invoke,
    cancel,
    done: () => done,
    taskRunner,
  };

  taskRegistry.set(id, task);

  return task;
};
