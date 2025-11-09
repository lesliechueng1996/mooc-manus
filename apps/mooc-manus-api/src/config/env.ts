type Env = {
  env: 'development' | 'production';
  logLevel: 'debug' | 'info' | 'warn' | 'error';
  redisUrl: string;
  databaseUrl: string;
  tencentCosSecretId: string;
  tencentCosSecretKey: string;
  tencentCosBucket: string;
  tencentCosRegion: string;
};

const formatEnv = (): Env => {
  const env = process.env.ENV ?? 'development';
  const logLevel = process.env.LOG_LEVEL ?? 'info';
  const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';
  const databaseUrl =
    process.env.DATABASE_URL ?? 'postgresql://localhost:5432/mooc-manus';
  const tencentCosSecretId = process.env.TENCENT_COS_SECRET_ID ?? '';
  const tencentCosSecretKey = process.env.TENCENT_COS_SECRET_KEY ?? '';
  const tencentCosBucket = process.env.TENCENT_COS_BUCKET ?? '';
  const tencentCosRegion = process.env.TENCENT_COS_REGION ?? '';

  return {
    env,
    logLevel,
    redisUrl,
    databaseUrl,
    tencentCosSecretId,
    tencentCosSecretKey,
    tencentCosBucket,
    tencentCosRegion,
  } as Env;
};

export const env = formatEnv();
