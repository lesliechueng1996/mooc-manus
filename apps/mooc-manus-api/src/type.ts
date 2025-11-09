import type { Logger } from 'pino';

export type Variables = {
  requestId: string;
  logger: Logger;
};

export type Context = {
  Variables: Variables;
};
