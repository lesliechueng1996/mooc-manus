import { createMiddleware } from 'hono/factory';

export const userIdMiddleware = createMiddleware(async (c, next) => {
  const userId = c.req.header('X-User-Id') ?? '';
  c.set('userId', userId);
  await next();
});
