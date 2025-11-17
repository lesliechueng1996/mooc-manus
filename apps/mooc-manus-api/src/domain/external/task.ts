import type { MessageQueue } from './message-queue';

export type TaskRunner = {
  invoke: (task: Task) => Promise<void>;
  destroy: () => Promise<void>;
  onDone: (task: Task) => Promise<void>;
};

export type Task = {
  invoke: () => void;
  cancel: () => boolean;
  inputStream: MessageQueue;
  outputStream: MessageQueue;
  id: string;
  done: () => boolean;
  taskRunner: TaskRunner;
};
