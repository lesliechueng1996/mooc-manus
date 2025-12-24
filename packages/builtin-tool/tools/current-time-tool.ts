import { getLogger } from '@repo/common';
import { tool } from '@repo/internal-langchain';
import { format } from 'date-fns';

export const currentTimeToolDefination = {
  name: 'current_time',
  description: 'A tool to get the current time',
  inputs: [],
  label: 'Get the current time',
  params: [],
  createdAt: 1722498386,
};

export const createCurrentTimeTool = () => {
  const logger = getLogger();

  return tool(
    () => {
      logger.info('Get the current time');
      return format(new Date(), 'yyyy-MM-dd HH:mm:ss xxx');
    },
    {
      name: currentTimeToolDefination.name,
      description: currentTimeToolDefination.description,
    },
  );
};
