import { createUILoggerConfiguration, type LogLevel } from '@repo/common';

export async function register() {
  await createUILoggerConfiguration(process.env.LOG_LEVEL as LogLevel);
}
