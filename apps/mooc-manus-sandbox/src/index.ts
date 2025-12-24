import { Elysia } from 'elysia';
import { supervisorRouter } from './interface/endpoint/supervisor';
import { fileRouter } from './interface/endpoint/file-router';
import { shellRouter } from './interface/endpoint/shell-router';

const app = new Elysia()
  .get('/', () => 'Hello Elysia')
  .use(supervisorRouter)
  .use(fileRouter)
  .use(shellRouter)
  .listen(8081);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
