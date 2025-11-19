'use server';

import { authActionClient } from '@/lib/safe-action';
import { generateCredentialReqSchema } from '@/schemas/upload-file-schema';
import { getUploadFileTempCredential } from '@/services/cos-service';

export const generateCredentialAction = authActionClient
  .inputSchema(generateCredentialReqSchema)
  .metadata({
    actionName: 'generateCredential',
  })
  .action(async ({ parsedInput: { fileName, fileSize } }) => {
    return getUploadFileTempCredential(fileName, fileSize);
  });
