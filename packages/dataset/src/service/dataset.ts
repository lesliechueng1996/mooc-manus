import {
  BadRequestException,
  calculatePagination,
  ForbiddenException,
  NotFoundException,
  paginationResult,
  type SearchPageReq,
} from '@repo/api-schema';
import { type Prisma, prisma } from '@repo/prisma-database';

const DEFAULT_DATASET_DESCRIPTION_FORMATTER =
  'When you need to answer questions about {{datasetName}}, you can reference this knowledge base.';

export const createDataset = async (data: {
  userId: string;
  name: string;
  description: string;
  icon: string;
}) => {
  const { userId, name, description, icon } = data;
  const datasetCount = await prisma.dataset.count({
    where: {
      userId,
      name,
    },
  });
  if (datasetCount > 0) {
    throw new BadRequestException('Dataset with the same name already exists');
  }

  const dataset = await prisma.dataset.create({
    data: {
      userId,
      name,
      icon,
      description:
        description ||
        DEFAULT_DATASET_DESCRIPTION_FORMATTER.replace('{datasetName}', name),
    },
  });

  return dataset;
};

export const listDatasetsByPage = async (
  userId: string,
  pageReq: SearchPageReq,
) => {
  const { offset, limit } = calculatePagination(pageReq);
  const where: Prisma.DatasetWhereInput = {
    userId,
  };
  if (pageReq.searchWord) {
    where.name = {
      contains: pageReq.searchWord,
      mode: 'insensitive',
    };
  }

  const listQuery = prisma.dataset.findMany({
    where,
    orderBy: {
      updatedAt: 'desc',
    },
    skip: offset,
    take: limit,
  });

  const totalQuery = prisma.dataset.count({
    where,
  });

  const [list, total] = await Promise.all([listQuery, totalQuery]);

  const datasetIds = list.map((item) => item.id);

  const documentResultQuery = prisma.document.groupBy({
    by: ['datasetId'],
    where: {
      datasetId: {
        in: datasetIds,
      },
    },
    _count: {
      id: true,
    },
    _sum: {
      characterCount: true,
    },
  });

  // TODO
  // const appDatasetJoinResultQuery = db
  //   .select({
  //     datasetId: appDatasetJoin.datasetId,
  //     appCount: sql<number>`cast(count(${appDatasetJoin.id}) as int)`,
  //   })
  //   .from(appDatasetJoin)
  //   .where(inArray(appDatasetJoin.datasetId, datasetIds))
  //   .groupBy(appDatasetJoin.datasetId);

  const [documentResult] = await Promise.all([
    documentResultQuery,
    // appDatasetJoinResultQuery,
  ]);

  const documentMap = new Map(
    documentResult.map((item) => [item.datasetId, item]),
  );

  // const appDatasetJoinMap = new Map(
  //   appDatasetJoinResult.map((item) => [item.datasetId, item]),
  // );
  const formattedList = list.map((item) => ({
    id: item.id,
    name: item.name,
    icon: item.icon,
    description: item.description,
    documentCount: documentMap.get(item.id)?._count.id ?? 0,
    characterCount: documentMap.get(item.id)?._sum.characterCount ?? 0,
    // relatedAppCount: appDatasetJoinMap.get(item.id)?.appCount ?? 0,
    relatedAppCount: 0,
    createdAt: item.createdAt.getTime(),
    updatedAt: item.updatedAt.getTime(),
  }));

  return paginationResult(formattedList, total, pageReq);
};

const getDatasetOrThrow = async (datasetId: string, userId: string) => {
  const dataset = await prisma.dataset.findUnique({
    where: {
      id: datasetId,
    },
  });
  if (!dataset) {
    throw new NotFoundException('Dataset not found');
  }
  if (dataset.userId !== userId) {
    throw new ForbiddenException('You are not allowed to operate this dataset');
  }
  return dataset;
};

export const deleteDataset = async (datasetId: string, userId: string) => {
  await getDatasetOrThrow(datasetId, userId);
  await prisma.$transaction([
    prisma.segment.deleteMany({
      where: {
        datasetId,
      },
    }),
    prisma.document.deleteMany({
      where: {
        datasetId,
      },
    }),
    prisma.dataset.delete({
      where: {
        id: datasetId,
      },
    }),
    // TODO delete app dataset join
  ]);
  return datasetId;
};

export const getDatasetBasicInfo = async (
  datasetId: string,
  userId: string,
) => {
  const dataset = await getDatasetOrThrow(datasetId, userId);
  return {
    id: dataset.id,
    name: dataset.name,
    icon: dataset.icon,
    description: dataset.description,
  };
};

export const updateDataset = async (
  datasetId: string,
  userId: string,
  data: {
    name: string;
    description: string;
    icon: string;
  },
) => {
  const { name, description, icon } = data;
  await getDatasetOrThrow(datasetId, userId);

  const datasetCount = await prisma.dataset.count({
    where: {
      userId,
      name,
      id: {
        not: datasetId,
      },
    },
  });
  if (datasetCount > 0) {
    throw new BadRequestException('Dataset with the same name already exists');
  }
  return await prisma.dataset.update({
    where: { id: datasetId },
    data: {
      name,
      description:
        description ||
        DEFAULT_DATASET_DESCRIPTION_FORMATTER.replace('{datasetName}', name),
      icon,
    },
  });
};
