import { BadRequestException } from '@repo/api-schema';
import { getLogger } from '@repo/pino-log';
import { openapiSchema } from '../schema/openapi';

export const validateOpenapiSchema = (schema: string) => {
  const log = getLogger();
  try {
    const data = openapiSchema.parse(JSON.parse(schema));
    const operationIds = new Set<string>();
    for (const [_, methods] of Object.entries(data.paths)) {
      for (const [_, { operationId }] of Object.entries(methods)) {
        if (operationIds.has(operationId)) {
          log.error(
            'operationId %s duplicate, validate openapi schema error',
            operationId,
          );
          throw new BadRequestException(`operationId ${operationId} duplicate`);
        }
        operationIds.add(operationId);
      }
    }

    return data;
  } catch (err) {
    log.error('validate openapi schema error: %o', { err });
    throw new BadRequestException('Invalid openapi schema');
  }
};
