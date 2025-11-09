type Env = {
  env: 'development' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  redisUrl: string;
  databaseUrl: string;
};

const formatEnv = (): Env => {
  const env = process.env.ENV ?? 'development';
  const logLevel = process.env.LOG_LEVEL ?? 'info';
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const databaseUrl =
    process.env.DATABASE_URL ?? 'postgresql://localhost:5432/mooc-manus';

  return {
    env,
    logLevel,
    redisUrl,
    databaseUrl,
  } as Env;
};

export const env = formatEnv();
