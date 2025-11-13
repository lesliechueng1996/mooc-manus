import { InternalServerErrorException } from '@/application/error/exception.js';
import { type AppConfig, appConfigSchema } from '@/domain/models/app-config.js';
import { getContextLogger } from '../logging/index.js';
import { databaseClient } from '../storage/database.js';

const createDefaultAppConfigIfNotExists = async (
  userId: string,
): Promise<AppConfig> => {
  const appConfig = await databaseClient.appConfig.findUnique({
    where: {
      userId,
    },
  });
  if (!appConfig) {
    const defaultAppConfig = appConfigSchema.parse({});
    await databaseClient.appConfig.create({
      data: {
        userId,
        ...defaultAppConfig,
      },
    });
    return defaultAppConfig;
  }
  return appConfigSchema.parse(appConfig);
};

export const loadByUserId = async (userId: string): Promise<AppConfig> => {
  const logger = getContextLogger();
  try {
    logger.info({ userId }, 'Loading app config');
    const appConfig = await createDefaultAppConfigIfNotExists(userId);
    return appConfig;
  } catch (error) {
    logger.error(error, 'Failed to load app config');
    throw new InternalServerErrorException('Failed to load app config');
  }
};

export const saveAppConfig = async (userId: string, appConfig: AppConfig) => {
  const logger = getContextLogger();
  try {
    logger.info({ userId }, 'Saving app config');
    await databaseClient.appConfig.update({
      where: {
        userId,
      },
      data: {
        ...appConfig,
      },
    });
  } catch (error) {
    logger.error(error, 'Failed to save app config');
    throw new InternalServerErrorException('Failed to save app config');
  }
};
