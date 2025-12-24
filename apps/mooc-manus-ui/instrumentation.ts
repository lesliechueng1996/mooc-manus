import { createUILoggerConfiguration, type LogLevel } from '@repo/common';

export async function register() {
  await createUILoggerConfiguration(Bun.env.LOG_LEVEL as LogLevel);
}
