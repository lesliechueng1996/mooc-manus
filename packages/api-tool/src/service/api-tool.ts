import {
  BadRequestException,
  calculatePagination,
  NotFoundException,
  paginationResult,
  type SearchPageReq,
} from '@repo/api-schema';
import { type Prisma, prisma } from '@repo/prisma-database';
import type {
  CreateApiToolReq,
  GetApiToolListRes,
  UpdateApiToolReq,
} from '../schema/api-tool';
import type { ApiToolParameter, OpenapiSchema } from '../schema/openapi';
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

const formatApiToolInputs = (parameters: ApiToolParameter) =>
  parameters.map((param) => ({
    type: param.type,
    name: param.name,
    description: param.description,
    required: param.required,
  }));

export const listApiToolsByPage = async (
  userId: string,
  pageReq: SearchPageReq,
) => {
  const { offset, limit } = calculatePagination(pageReq);
  const where: Prisma.ApiToolProviderWhereInput = {
    userId,
  };
  if (pageReq.searchWord) {
    where.name = {
      contains: pageReq.searchWord,
      mode: 'insensitive',
    };
  }

  const listQuery = prisma.apiToolProvider.findMany({
    include: {
      apiTools: true,
    },
    where,
    orderBy: {
      createdAt: 'desc',
    },
    skip: offset,
    take: limit,
  });

  const countQuery = prisma.apiToolProvider.count({
    where,
  });

  const [list, total] = await Promise.all([listQuery, countQuery]);

  const formattedList: GetApiToolListRes[] = list.map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    description: item.description,
    headers: item.headers as Record<string, string>[],
    createdAt: item.createdAt.getTime(),
    tools: item.apiTools.map((tool) => ({
      id: tool.id,
      name: tool.name,
      description: tool.description,
      inputs: formatApiToolInputs(tool.parameters as ApiToolParameter),
    })),
  }));

  return paginationResult(formattedList, total, pageReq);
};

export const getApiToolProvider = async (
  userId: string,
  providerId: string,
) => {
  const apiToolProviderRecord = await prisma.apiToolProvider.findUnique({
    where: {
      id: providerId,
      userId,
    },
  });

  if (!apiToolProviderRecord) {
    throw new NotFoundException('API tool provider not found');
  }

  return {
    id: apiToolProviderRecord.id,
    name: apiToolProviderRecord.name,
    icon: apiToolProviderRecord.icon,
    description: apiToolProviderRecord.description,
    openapiSchema: apiToolProviderRecord.openapiSchema,
    headers: apiToolProviderRecord.headers as Array<{
      key: string;
      value: string;
    }>,
    createdAt: apiToolProviderRecord.createdAt.getTime(),
  };
};

export const updateApiTool = async (
  userId: string,
  providerId: string,
  data: UpdateApiToolReq,
) => {
  const { name, icon, openapiSchema, headers } = data;
  const validatedOpenapiData = validateOpenapiSchema(openapiSchema);

  const countUserSameNameApiToolProvider = await prisma.apiToolProvider.count({
    where: {
      userId,
      name,
      id: {
        not: providerId,
      },
    },
  });
  if (countUserSameNameApiToolProvider > 0) {
    throw new BadRequestException('Tool with the same name already exists');
  }

  const tools = formatApiTools(validatedOpenapiData, userId);

  await prisma.$transaction([
    prisma.apiTool.deleteMany({
      where: {
        providerId,
        userId,
      },
    }),
    prisma.apiToolProvider.update({
      data: {
        name,
        icon,
        description: validatedOpenapiData.description,
        openapiSchema: JSON.stringify(validatedOpenapiData),
        headers,
      },
      where: {
        id: providerId,
        userId,
      },
    }),
    prisma.apiTool.createMany({
      data: tools.map((tool) => ({
        ...tool,
        providerId,
      })),
    }),
  ]);

  return providerId;
};

export const deleteApiTool = async (userId: string, providerId: string) => {
  await prisma.apiToolProvider.delete({
    where: {
      userId,
      id: providerId,
    },
  });
  return providerId;
};
