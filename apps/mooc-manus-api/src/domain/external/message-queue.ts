export type MessageData = {
  data: string;
};

export type Message = {
  id: string;
  message: MessageData;
};

export interface MessageQueue {
  put(data: MessageData): Promise<string | null>;
  get(startId: string | null, blockMs: number): Promise<Message | null>;
  pop: () => Promise<Message | null>;
  clear: () => Promise<void>;
  isEmpty: () => Promise<boolean>;
  size: () => Promise<number>;
  deleteMessage: (id: string) => Promise<boolean>;
}
