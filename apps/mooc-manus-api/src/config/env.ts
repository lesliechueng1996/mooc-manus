type Env = {
  env: 'development' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
};

const formatEnv = (): Env => {
  const env = process.env.ENV ?? 'development';
  const logLevel = process.env.LOG_LEVEL ?? 'info';

  return {
    env,
    logLevel,
  } as Env;
};

export const env = formatEnv();
