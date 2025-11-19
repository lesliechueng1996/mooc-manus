import * as fs from 'node:fs/promises';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@repo/api-schema';
import { getLogger } from '@repo/pino-log';
import COS from 'cos-nodejs-sdk-v5';
import { format } from 'date-fns';
import qcloudCosSts from 'qcloud-cos-sts';
import { v4 as uuidv4 } from 'uuid';
import { ALLOWED_IMAGE_EXTENSIONS, ALLOWED_IMAGE_SIZE } from './constant';
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

const getTempCredential = async (fileKey: string) => {
  const bucketName = process.env.TENCENT_COS_BUCKET ?? '';
  const appId = bucketName.substring(1 + bucketName.lastIndexOf('-'));

  const credential = await qcloudCosSts.getCredential({
    secretId: process.env.TENCENT_COS_SECRET_ID ?? '',
    secretKey: process.env.TENCENT_COS_SECRET_KEY ?? '',
    policy: {
      version: '2.0',
      statement: [
        {
          action: ['name/cos:PutObject'],
          effect: 'allow',
          principal: { qcs: ['*'] },
          resource: [
            `qcs::cos:${process.env.TENCENT_COS_REGION ?? ''}:uid/${appId}:${bucketName}/${fileKey}`,
          ],
        },
      ],
    },
  });

  return {
    tmpSecretId: credential.credentials.tmpSecretId,
    tmpSecretKey: credential.credentials.tmpSecretKey,
    sessionToken: credential.credentials.sessionToken,
    startTime: credential.startTime,
    expiredTime: credential.expiredTime,
  };
};

export const getCosClient = () => {
  if (!cosClient) {
    throw new InternalServerErrorException('Cos client not initialized');
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
      logger.info(`Temp file path: ${tempFilePath}`);

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
                logger.error(`Upload file failed: ${err}`);
                reject(err);
              } else {
                resolve(data);
              }
            },
          );
        },
      );

      const result = await uploadPromise;
      logger.info('Upload file success');

      return {
        name: data.file.name,
        key: fileKey,
        size: data.file.size,
        extension: ext,
        mimeType: data.file.type,
        hash: result.ETag,
      };
    } catch (error) {
      logger.error(`Upload file failed: ${error}`);
      throw error;
    }
  });
};

export const getUploadFileTempCredential = async (
  fileName: string,
  fileSize: number,
) => {
  const ext = fileName.split('.').pop()?.toLowerCase();
  if (!ext) {
    throw new BadRequestException('File format is incorrect');
  }

  if (ALLOWED_IMAGE_EXTENSIONS.includes(ext)) {
    if (fileSize > ALLOWED_IMAGE_SIZE) {
      throw new BadRequestException('Image size exceeds the limit');
    }

    const fileKey = generateFileKey(ext);
    const credential = await getTempCredential(fileKey);

    return {
      credential,
      key: fileKey,
      bucket: {
        schema: process.env.TENCENT_COS_SCHEMA ?? '',
        name: process.env.TENCENT_COS_BUCKET ?? '',
        region: process.env.TENCENT_COS_REGION ?? '',
      },
    };
  }

  throw new BadRequestException('File extension is incorrect');
};

export const destroyCosClient = () => {
  cosConfig.bucket = '';
  cosConfig.region = '';
  cosClient = null;
};
