import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';

export const withTempFile = async <T>(
  fileKey: string,
  callback: (filePath: string) => Promise<T>,
) => {
  let tempFilePath = '';
  try {
    tempFilePath = path.join(os.tmpdir(), fileKey);

    const tempDir = path.dirname(tempFilePath);
    await fs.mkdir(tempDir, { recursive: true });

    console.log(`temp file path: ${tempFilePath}`);
    return await callback(tempFilePath);
  } catch (error) {
    console.error(`处理临时文件失败: ${error}`);
    throw error;
  } finally {
    if (tempFilePath) {
      await fs.rm(tempFilePath);
      console.log(`delete temp file: ${tempFilePath}`);
    }
  }
};
