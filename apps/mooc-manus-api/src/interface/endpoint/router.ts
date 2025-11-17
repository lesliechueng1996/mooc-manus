import { Hono } from 'hono';
import type { Env } from '@/type';

export const createApiRouter = () => {
  return new Hono<Env>();
};
