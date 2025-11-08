export type Bindings = {
  ENV: 'development' | 'production';
  DATABASE_URL: string;
  REDIS_HOST: string;
  REDIS_PORT: string;
  REDIS_DB: string;
  REDIS_PASSWORD: string;
};
