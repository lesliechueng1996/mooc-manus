import { WikipediaQueryRun } from '@repo/internal-langchain/community';

const defaultWikipediaTool = new WikipediaQueryRun();

export const createWikipediaTool = () => {
  return defaultWikipediaTool;
};

export const wikipediaToolDefination = {
  name: defaultWikipediaTool.name,
  description: defaultWikipediaTool.description,
  inputs: [
    {
      name: 'input',
      description: 'Search keywords',
      required: true,
      type: 'string' as const,
    },
  ],
  label: 'Wikipedia search',
  params: [],
  createdAt: 1722498386,
};
