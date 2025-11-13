import { Hono } from 'hono';
import type { Env } from '@/type.js';

export const createApiRouter = () => {
  return new Hono<Env>();
};
