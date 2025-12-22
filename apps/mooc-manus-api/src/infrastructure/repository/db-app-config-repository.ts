import { InternalServerErrorException } from '@repo/common';
import { type AppConfig, appConfigSchema } from '@/domain/model/app-config';
import type { Logger } from '../logging';
import { databaseClient } from '../storage/database';

export class DbAppConfigRepository {
  constructor(private readonly logger: Logger) {}

  private async createDefaultAppConfigIfNotExists(
    userId: string,
  ): Promise<AppConfig> {
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
  }

  async loadAppConfigByUserId(userId: string): Promise<AppConfig> {
    try {
      this.logger.info('Loading app config: {userId}', { userId });
      const appConfig = await this.createDefaultAppConfigIfNotExists(userId);
      return appConfig;
    } catch (error) {
      this.logger.error('Failed to load app config', { error });
      throw new InternalServerErrorException('Failed to load app config');
    }
  }

  async saveAppConfig(userId: string, appConfig: AppConfig): Promise<void> {
    try {
      this.logger.info('Saving app config: {userId}', { userId });
      await databaseClient.appConfig.update({
        where: {
          userId,
        },
        data: {
          ...appConfig,
        },
      });
    } catch (error) {
      this.logger.error('Failed to save app config', { error });
      throw new InternalServerErrorException('Failed to save app config');
    }
  }
}
