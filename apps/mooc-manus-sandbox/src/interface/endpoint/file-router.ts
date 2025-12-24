import { Elysia } from "elysia";

export const fileRouter = new Elysia({ name: 'file-router', prefix: '/file', tags: ['File'] })