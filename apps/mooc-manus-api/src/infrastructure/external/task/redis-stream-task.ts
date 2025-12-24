import { randomUUIDv7 } from 'bun';
import type { Task, TaskRunner } from '@/domain/external/task';
import type { Logger } from '@/infrastructure/logging';
import { RedisStreamMessageQueue } from '../message-queue/redis-stream-message-queue';

export class RedisStreamTask implements Task {
  static taskRegistry = new Map<string, Task>();

  readonly id: string;
  readonly inputStream: RedisStreamMessageQueue;
  readonly outputStream: RedisStreamMessageQueue;
  done: boolean;

  private readonly abortController: AbortController;

  private inProgress: boolean;
  private task: Task | null;

  constructor(
    private readonly logger: Logger,
    readonly taskRunner: TaskRunner,
  ) {
    this.id = randomUUIDv7();
    this.abortController = new AbortController();
    this.inputStream = new RedisStreamMessageQueue(
      logger,
      `task:input:${this.id}`,
    );
    this.outputStream = new RedisStreamMessageQueue(
      logger,
      `task:output:${this.id}`,
    );
    this.done = false;
    this.inProgress = false;
    this.task = null;

    RedisStreamTask.taskRegistry.set(this.id, this);
  }

  private cleanupRegistry(): void {
    if (RedisStreamTask.taskRegistry.has(this.id)) {
      this.logger.info(`Cleaning up task registry for task ${this.id}`);
      RedisStreamTask.taskRegistry.delete(this.id);
    }
  }

  private async onTaskDone(): Promise<void> {
    if (!this.task) {
      this.logger.error('Task not found');
      return;
    }
    await this.taskRunner.onDone(this.task);
    this.cleanupRegistry();
  }

  private async executeTask(): Promise<void> {
    const { resolve, reject, promise } = Promise.withResolvers<void>();

    const onAbort = () => {
      this.logger.error('Task cancelled');
      reject(new Error('Task cancelled'));
    };

    const resultPromise = promise.finally(() => {
      this.abortController.signal.removeEventListener('abort', onAbort);
      this.done = true;
      this.inProgress = false;
      this.onTaskDone().catch((error) => {
        this.logger.error(`Failed to execute onTaskDone for task ${this.id}`, {
          error,
        });
      });
    });

    if (!this.task) {
      this.logger.error('Task not found');
      reject(new Error('Task not found'));
      return resultPromise;
    }

    if (this.abortController.signal.aborted) {
      onAbort();
      return resultPromise;
    }

    this.abortController.signal.addEventListener('abort', onAbort);

    this.taskRunner.invoke(this.task).then(resolve).catch(reject);

    return resultPromise;
  }

  invoke(): void {
    if (this.done && !this.inProgress) {
      this.inProgress = true;
      this.executeTask();
      this.logger.info(`Executing task ${this.id}`);
    }
  }

  cancel(): boolean {
    if (!this.done) {
      this.abortController.abort();
      this.logger.info(`Cancelled task ${this.id}`);
    }
    this.cleanupRegistry();
    return true;
  }

  static getTask(id: string): Task | undefined {
    return RedisStreamTask.taskRegistry.get(id);
  }

  static destroy = async () => {
    for (const task of RedisStreamTask.taskRegistry.values()) {
      task.cancel();
      await task.taskRunner.destroy();
    }
    RedisStreamTask.taskRegistry.clear();
  };
}
