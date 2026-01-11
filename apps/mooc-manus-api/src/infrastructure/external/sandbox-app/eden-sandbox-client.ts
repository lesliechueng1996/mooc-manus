import { treaty } from '@elysiajs/eden';
import type { SandboxApp } from '~/index';

export const createSandboxAppClient = (baseUrl: string) => {
  return treaty<SandboxApp>(baseUrl);
};
