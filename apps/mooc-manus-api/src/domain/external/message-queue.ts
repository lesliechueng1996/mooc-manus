export type MessageQueue<T> = {
  put: (message: T) => Promise<string | null>;
  get: (
    startId: string | null,
    blockMs: number,
  ) => Promise<{
    id: string;
    message: T;
  } | null>;
  pop: () => Promise<{
    id: string;
    message: T;
  } | null>;
  clear: () => Promise<void>;
  isEmpty: () => Promise<boolean>;
  size: () => Promise<number>;
  deleteMessage: (id: string) => Promise<boolean>;
};
