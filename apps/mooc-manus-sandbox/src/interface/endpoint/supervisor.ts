import { Elysia } from 'elysia';

export const supervisorRouter = new Elysia({
  name: 'supervisor-router',
  prefix: '/supervisor',
  tags: ['Supervisor'],
});
