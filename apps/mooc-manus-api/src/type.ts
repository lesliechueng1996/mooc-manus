import type { Logger } from '@repo/pino-log';

export type Variables = {
  requestId: string;
  logger: Logger;
  userId: string;
};

export type Context = {
  Variables: Variables;
};

export type Env = {
  Variables: Variables;
};
