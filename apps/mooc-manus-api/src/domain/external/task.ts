import type { MessageQueue } from './message-queue.js';

export type TaskRunner = {
  invoke: (task: Task) => void;
  destroy: () => void;
  onDone: (task: Task) => void;
};

export type Task = {
  run: () => void;
  cancel: () => void;
  inputStream: MessageQueue;
  outputStream: MessageQueue;
  id: string;
  done: boolean;
};

export type getTask = (taskId: string) => Promise<Task | null>;
export type createTask = (taskRunner: TaskRunner) => Promise<Task>;
export type destoryAllTasks = () => Promise<void>;
