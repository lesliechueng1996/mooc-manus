import * as fs from 'node:fs/promises';
import { getLogger } from '@repo/pino-log';
import COS from 'cos-nodejs-sdk-v5';
import { format } from 'date-fns';
import { v4 as uuidv4 } from 'uuid';
import { withTempFile } from './temp-file';

const logger = getLogger();

let cosClient: COS | null = null;
const cosConfig: {
  bucket: string;
  region: string;
} = {
  bucket: '',
  region: '',
};

export const createCosClient = (data: {
  secretId: string;
  secretKey: string;
  bucket: string;
  region: string;
}) => {
  cosClient = new COS({
    SecretId: data.secretId,
    SecretKey: data.secretKey,
  });
  cosConfig.bucket = data.bucket;
  cosConfig.region = data.region;
};

export const getCosClient = () => {
  if (!cosClient) {
    throw new Error('Cos client not initialized');
  }
  return cosClient;
};

export const generateFileKey = (ext: string) => {
  const date = format(new Date(), 'yyyyMMdd');
  return `${date}/${uuidv4()}.${ext}`;
};

export const uploadFile = async (data: {
  bucket?: string;
  region?: string;
  key?: string;
  file: File;
}) => {
  const ext = data.file.name.split('.').pop() ?? '';
  const fileKey = data.key ?? generateFileKey(ext);
  withTempFile(fileKey, async (tempFilePath) => {
    try {
      logger.info(`暂存文件到: ${tempFilePath}`);

      const fileData = await data.file.arrayBuffer();
      await fs.writeFile(tempFilePath, Buffer.from(fileData));

      const uploadPromise = new Promise<COS.UploadFileResult>(
        (resolve, reject) => {
          getCosClient().uploadFile(
            {
              Bucket: process.env.TENCENT_COS_BUCKET ?? '',
              Region: process.env.TENCENT_COS_REGION ?? '',
              Key: fileKey,
              FilePath: tempFilePath,
            },
            (err, data) => {
              if (err) {
                logger.error(`上传文件失败: ${err}`);
                reject(err);
              } else {
                resolve(data);
              }
            },
          );
        },
      );

      const result = await uploadPromise;
      logger.info('上传文件成功');

      return {
        name: data.file.name,
        key: fileKey,
        size: data.file.size,
        extension: ext,
        mimeType: data.file.type,
        hash: result.ETag,
      };
    } catch (error) {
      logger.error(`上传文件失败: ${error}`);
      throw error;
    }
  });
};

export const destroyCosClient = () => {
  cosConfig.bucket = '';
  cosConfig.region = '';
  cosClient = null;
};
