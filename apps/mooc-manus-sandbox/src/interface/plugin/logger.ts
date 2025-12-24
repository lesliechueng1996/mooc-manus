import { Elysia } from 'elysia';
import { Logger } from '@/infrastructure/logging';

export const logger = new Elysia({ name: 'logger' }).decorate(
  'logger',
  new Logger(),
);
