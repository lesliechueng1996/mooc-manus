import { createCosClient } from '@repo/tencent-cos';
import { env } from '@/config/env.js';

export { destroyCosClient } from '@repo/tencent-cos';

export const connectCos = () => {
  createCosClient({
    secretId: env.tencentCosSecretId,
    secretKey: env.tencentCosSecretKey,
    bucket: env.tencentCosBucket,
    region: env.tencentCosRegion,
  });
};
