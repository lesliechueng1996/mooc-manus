'use server';

import { createApiTool, validateOpenapiSchema } from '@repo/api-tool';
import { authActionClient } from '@/lib/safe-action';
import {
  createApiToolReqSchema,
  validateOpenapiSchemaReqSchema,
} from '@/schemas/api-tool-schema';

export const validateOpenapiSchemaAction = authActionClient
  .inputSchema(validateOpenapiSchemaReqSchema)
  .metadata({
    actionName: 'validateOpenapiSchema',
  })
  .action(async ({ parsedInput: { openapiSchema } }) => {
    validateOpenapiSchema(openapiSchema);
    return true;
  });

export const saveApiToolProviderAction = authActionClient
  .inputSchema(createApiToolReqSchema)
  .metadata({
    actionName: 'saveApiToolProvider',
  })
  .action(async ({ parsedInput, ctx: { userId } }) =>
    createApiTool(userId, parsedInput),
  );
