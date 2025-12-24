import type { AppConfig } from '../model/app-config';

export interface AppConfigRepository {
  loadAppConfigByUserId(userId: string): Promise<AppConfig>;
  saveAppConfig(userId: string, appConfig: AppConfig): Promise<void>;
}
