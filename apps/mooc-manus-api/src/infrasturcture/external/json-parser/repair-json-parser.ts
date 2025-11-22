import { jsonrepair } from 'jsonrepair';
import type { ParseJson } from '@/domain/external/json-parser';
import { getContextLogger } from '@/infrasturcture/logging';

export const repairParseJson: ParseJson = async (json, defaultValue) => {
  const logger = getContextLogger();
  logger.info(`Repairing JSON: ${json}`);
  if (!json || json.trim() === '') {
    if (defaultValue) {
      return defaultValue;
    }
    throw new Error('JSON is empty and no default value provided');
  }
  return JSON.parse(jsonrepair(json));
};
