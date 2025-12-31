import { createHash } from 'node:crypto';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { getLogger } from '../logger';

export const withTempFile = async <T>(
  fileKey: string,
  callback: (filePath: string) => Promise<T>,
) => {
  const logger = getLogger();

  let tempFilePath = '';
  try {
    tempFilePath = path.join(os.tmpdir(), fileKey);

    const tempDir = path.dirname(tempFilePath);
    await fs.mkdir(tempDir, { recursive: true });

    logger.info('Temp file: {filePath}', { filePath: tempFilePath });
    return await callback(tempFilePath);
  } catch (error) {
    logger.error('Failed to create temp file: {error}', { error });
    throw error;
  } finally {
    if (tempFilePath) {
      await fs.rm(tempFilePath);
      logger.info('Deleted temp file: {filePath}', { filePath: tempFilePath });
    }
  }
};

export const hashText = (text: string) => {
  const hasher = createHash('sha256');
  return hasher.update(text).digest('hex');
};
