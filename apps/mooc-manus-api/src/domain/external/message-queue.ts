type MessageData = {
  data: string;
};

export type MessageQueue = {
  put: (message: MessageData) => Promise<string | null>;
  get: (
    startId: string | null,
    blockMs: number,
  ) => Promise<{
    id: string;
    message: MessageData;
  } | null>;
  pop: () => Promise<{
    id: string;
    message: MessageData;
  } | null>;
  clear: () => Promise<void>;
  isEmpty: () => Promise<boolean>;
  size: () => Promise<number>;
  deleteMessage: (id: string) => Promise<boolean>;
};
