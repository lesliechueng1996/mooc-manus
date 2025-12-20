import { Elysia } from 'elysia';

export const appConfigRouter = new Elysia({
  prefix: '/app-config',
}).get('/llm', () => {});
