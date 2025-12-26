import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import { getLogger } from '@repo/common';

const logger = getLogger();

export const withTempFile = async <T>(
  fileKey: string,
  callback: (filepath: string) => Promise<T>,
) => {
  let tempFilepath = '';
  try {
    tempFilepath = path.join(os.tmpdir(), fileKey);

    const tempDir = path.dirname(tempFilepath);
    await fs.mkdir(tempDir, { recursive: true });

    logger.info(`temp file path: ${tempFilepath}`);
    return await callback(tempFilepath);
  } catch (error) {
    logger.error(`处理临时文件失败: ${error}`);
    throw error;
  } finally {
    if (tempFilepath) {
      await fs.rm(tempFilepath);
      logger.info(`delete temp file: ${tempFilepath}`);
    }
  }
};
