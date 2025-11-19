import { z } from 'zod';

const ALLOWED_METHODS = ['get', 'post', 'put', 'delete', 'patch'] as const;
const ALLOWED_PARAMETER_LOCATIONS = [
  'path',
  'query',
  'header',
  'cookie',
  'body',
] as const;
export const ALLOWED_PARAMETER_TYPE = [
  'string',
  'integer',
  'float',
  'boolean',
] as const;

export const parameterSchema = z.array(
  z.object({
    name: z.string().trim().nonempty(),
    in: z.enum(ALLOWED_PARAMETER_LOCATIONS),
    description: z.string().trim().nonempty(),
    required: z.boolean(),
    type: z.enum(ALLOWED_PARAMETER_TYPE),
  }),
);

export const openapiSchema = z.object({
  server: z.url(),
  description: z.string().trim().nonempty(),
  paths: z.record(
    z.string(),
    z
      .record(
        z.string(),
        z.object({
          description: z.string().trim().nonempty(),
          operationId: z.string().trim().nonempty(),
          parameters: parameterSchema,
        }),
      )
      .refine(
        (methods) => {
          const methodKeys = Object.keys(methods);
          return methodKeys.every((key) =>
            ALLOWED_METHODS.includes(key as (typeof ALLOWED_METHODS)[number]),
          );
        },
        {
          message: `Method must be one of: ${ALLOWED_METHODS.join(', ')}`,
        },
      ),
  ),
});

export type OpenapiSchema = z.infer<typeof openapiSchema>;
