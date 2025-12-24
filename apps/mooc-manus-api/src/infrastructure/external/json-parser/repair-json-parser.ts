import { jsonrepair } from 'jsonrepair';
import type { JsonParser } from '@/domain/external/json-parser';
import type { Logger } from '@/infrastructure/logging';

export class RepairJsonParser implements JsonParser {
  constructor(private readonly logger: Logger) {}

  async parse(
    json: string,
    defaultValue?: unknown,
  ): Promise<
    Record<string, unknown> | Array<Record<string, unknown>> | unknown
  > {
    this.logger.info(`Repairing JSON: ${json}`);
    if (!json || json.trim() === '') {
      if (defaultValue) {
        return defaultValue;
      }
      throw new Error('JSON is empty and no default value provided');
    }
    return JSON.parse(jsonrepair(json));
  }
}
