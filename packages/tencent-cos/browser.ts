import COS from 'cos-js-sdk-v5';

export const createCosClient = (data: {
  tmpSecretId: string;
  tmpSecretKey: string;
  sessionToken: string;
  startTime: number;
  expiredTime: number;
}) =>
  new COS({
    SecretId: data.tmpSecretId,
    SecretKey: data.tmpSecretKey,
    SecurityToken: data.sessionToken,
    StartTime: data.startTime,
    ExpiredTime: data.expiredTime,
  });

export const uploadFile = async (
  credential: Parameters<typeof createCosClient>[0],
  data: {
    bucket: string;
    region: string;
    key: string;
    file: File;
    sliceSize: number;
    schema: string;
  },
) => {
  const cos = createCosClient(credential);

  return new Promise<string | null>((resolve) => {
    cos.uploadFile(
      {
        Bucket: data.bucket,
        Region: data.region,
        Key: data.key,
        Body: data.file,
        SliceSize: data.sliceSize,
      },
      (err, result) => {
        if (err) {
          resolve(null);
          return;
        }

        const url = `${data.schema}://${result.Location}`;
        resolve(url);
      },
    );
  });
};

export const uploadFileWithProgress = async (
  credential: Parameters<typeof createCosClient>[0],
  data: {
    bucket: string;
    region: string;
    key: string;
    file: File;
  },
  onProgress: (progress: number) => void,
) => {
  const cos = createCosClient(credential);

  new Promise((resolve, reject) => {
    cos.uploadFile(
      {
        Bucket: data.bucket,
        Region: data.region,
        Key: data.key,
        Body: data.file,
        onProgress: (progress) => {
          onProgress(progress.percent);
        },
      },
      (err, result) => {
        if (err) {
          reject(err);
          return;
        }

        resolve({
          name: data.file.name,
          key: result.Location,
          size: data.file.size,
          extension: data.file.name.split('.').pop() ?? '',
          mimeType: data.file.type,
          hash: result.ETag?.replace(/^"|"$/g, '') ?? '',
        });
      },
    );
  });
};
