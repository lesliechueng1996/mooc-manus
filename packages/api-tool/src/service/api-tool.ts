import { BadRequestException } from '@repo/api-schema';
import { prisma } from '@repo/prisma-database';
import type { CreateApiToolReq } from '../schema/api-tool';
import type { OpenapiSchema } from '../schema/openapi';
import { validateOpenapiSchema } from './openapi-schema';

const formatApiTools = (openapi: OpenapiSchema, userId: string) => {
  const tools: {
    userId: string;
    name: string;
    description: string;
    url: string;
    method: string;
    parameters: Record<string, string | boolean>[];
  }[] = [];

  for (const path in openapi.paths) {
    const pathObj = openapi.paths[path];
    for (const method in pathObj) {
      const methodObj = pathObj[method as keyof typeof pathObj];
      if (!methodObj) {
        continue;
      }
      tools.push({
        userId,
        name: methodObj.operationId,
        description: methodObj.description,
        url: `${openapi.server}${path}`,
        method,
        parameters: methodObj.parameters,
      });
    }
  }

  return tools;
};

export const createApiTool = async (userId: string, data: CreateApiToolReq) => {
  const { name, icon, openapiSchema, headers } = data;
  const validatedOpenapiData = validateOpenapiSchema(openapiSchema);
  const countUserSameNameApiToolProvider = await prisma.apiToolProvider.count({
    where: {
      userId,
      name,
    },
  });

  if (countUserSameNameApiToolProvider > 0) {
    throw new BadRequestException('Tool with the same name already exists');
  }

  const tools = formatApiTools(validatedOpenapiData, userId);

  const provider = await prisma.apiToolProvider.create({
    data: {
      userId,
      name,
      icon,
      description: validatedOpenapiData.description,
      openapiSchema: JSON.stringify(validatedOpenapiData),
      headers,
      apiTools: {
        create: tools,
      },
    },
  });

  return provider.id;
};
