import { prisma } from '@repo/prisma-database';
import { BadRequestException } from '@repo/api-schema';

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
