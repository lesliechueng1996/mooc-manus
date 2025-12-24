import { createUILoggerConfiguration } from '@repo/common';

export async function register() {
  await createUILoggerConfiguration();
}
