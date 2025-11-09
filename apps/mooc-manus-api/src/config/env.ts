type Env = {
  env: 'development' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  redisUrl: string;
};

const formatEnv = (): Env => {
  const env = process.env.ENV ?? 'development';
  const logLevel = process.env.LOG_LEVEL ?? 'info';
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

  return {
    env,
    logLevel,
    redisUrl,
  } as Env;
};

export const env = formatEnv();
