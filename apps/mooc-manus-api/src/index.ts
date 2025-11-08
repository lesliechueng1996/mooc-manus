import { responseSchema } from '@repo/api-schema';
import { Hono } from 'hono';
import type { Bindings } from './config/env';

const app = new Hono<{ Bindings: Bindings }>();

app.get('/', (c) => {
  console.log(c.env.REDIS_PORT);
  const response = responseSchema.parse({
    message: 'Hello Hono!',
    data: {
      name: 'John Doe',
      age: 30,
    },
  });
  return c.json(response);
});

export default app;
