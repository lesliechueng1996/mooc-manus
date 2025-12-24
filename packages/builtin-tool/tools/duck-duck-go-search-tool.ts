import { DuckDuckGoSearch } from '@repo/internal-langchain/community';

const defaultDuckDuckGoSearchTool = new DuckDuckGoSearch();

export const createDuckDuckGoSearchTool = () => {
  return defaultDuckDuckGoSearchTool;
};

export const duckDuckGoSearchToolDefination = {
  name: defaultDuckDuckGoSearchTool.name,
  description: defaultDuckDuckGoSearchTool.description,
  inputs: [
    {
      name: 'input',
      description: 'Search keywords',
      required: true,
      type: 'string' as const,
    },
  ],
  label: 'DuckDuckGo search',
  params: [],
  createdAt: 1722498386,
};
