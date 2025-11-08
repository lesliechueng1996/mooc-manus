import { responseSchema } from '@repo/api-schema';
import { Hono } from 'hono';

const app = new Hono();

app.get('/', (c) => {
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
