import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { getLogger } from '@repo/common';

const logger = getLogger();

export const withTempFile = async <T>(
  fileKey: string,
  callback: (filePath: string) => Promise<T>,
) => {
  let tempFilePath = '';
  try {
    tempFilePath = path.join(os.tmpdir(), fileKey);

    const tempDir = path.dirname(tempFilePath);
    await fs.mkdir(tempDir, { recursive: true });

    logger.info(`temp file path: ${tempFilePath}`);
    return await callback(tempFilePath);
  } catch (error) {
    logger.error(`处理临时文件失败: ${error}`);
    throw error;
  } finally {
    if (tempFilePath) {
      await fs.rm(tempFilePath);
      logger.info(`delete temp file: ${tempFilePath}`);
    }
  }
};
