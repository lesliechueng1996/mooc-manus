import { Elysia } from "elysia";

export const shellRouter = new Elysia({ name: 'shell-router', prefix: '/shell', tags: ['Shell'] })