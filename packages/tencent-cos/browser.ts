import COS from 'cos-js-sdk-v5';

export const createCosClient = (data: {
  secretId: string;
  secretKey: string;
  sessionToken: string;
  startTime: number;
  expiredTime: number;
}) =>
  new COS({
    SecretId: data.secretId,
    SecretKey: data.secretKey,
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
