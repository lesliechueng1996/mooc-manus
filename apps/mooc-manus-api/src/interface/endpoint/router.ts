import { Hono } from 'hono';
import type { Variables } from '@/type.js';

export const createApiRouter = () => {
  return new Hono<{ Variables: Variables }>();
};
