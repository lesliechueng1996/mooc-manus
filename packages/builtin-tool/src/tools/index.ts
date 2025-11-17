import type { StructuredTool } from '@repo/internal-langchain';
import {
  createCurrentTimeTool,
  currentTimeToolDefination,
} from './current-time-tool';
import { createDallETool, dallEToolDefination } from './dall-e-tool';
import {
  createDuckDuckGoSearchTool,
  duckDuckGoSearchToolDefination,
} from './duck-duck-go-search-tool';
import { createGaodeIpTool, gaodeIpToolDefination } from './gaode-ip-tool';
import {
  createGaodeWeatherTool,
  gaodeWeatherToolDefination,
} from './gaode-weather-tool';
import { createWikipediaTool, wikipediaToolDefination } from './wikipedia-tool';

const host = '';

type Category = {
  category: string;
  name: string;
  icon: string;
};

export const categories: Category[] = [
  {
    category: 'search',
    name: 'Search',
    icon: `${host}/icons/search.svg`,
  },
  {
    category: 'image',
    name: 'Image',
    icon: `${host}/icons/image.svg`,
  },
  {
    category: 'weather',
    name: 'Weather',
    icon: `${host}/icons/weather.svg`,
  },
  {
    category: 'tool',
    name: 'Tool',
    icon: `${host}/icons/tool.svg`,
  },
  {
    category: 'other',
    name: 'Other',
    icon: `${host}/icons/other.svg`,
  },
];

type BuiltinToolBaseParam = {
  name: string;
  label: string;
  help?: string;
  required: boolean;
};

type BuiltinToolSelectParam = BuiltinToolBaseParam & {
  type: 'select';
  default: string | number | boolean;
  options: {
    value: string | number | boolean;
    label: string;
  }[];
};

type BuiltinToolNumberParam = BuiltinToolBaseParam & {
  type: 'number';
  default: number;
  min?: number;
  max?: number;
};

type BuiltinToolBooleanParam = BuiltinToolBaseParam & {
  type: 'boolean';
  default: boolean;
};

type BuiltinToolStringParam = BuiltinToolBaseParam & {
  type: 'string';
  default: string;
};

export type BuiltinToolParam =
  | BuiltinToolSelectParam
  | BuiltinToolNumberParam
  | BuiltinToolBooleanParam
  | BuiltinToolStringParam;

type BuiltinTool = {
  name: string;
  label: string;
  description: string;
  icon: string;
  category: string;
  createdAt: number;
  background: string;
  tools: {
    name: string;
    label: string;
    description: string;
    inputs: {
      name: string;
      description: string;
      required: boolean;
      type: 'string' | 'number' | 'boolean';
    }[];
    params: BuiltinToolParam[];
    createdAt: number;
    fn: (params: Record<string, unknown>) => StructuredTool;
  }[];
};

export const builtinTools: BuiltinTool[] = [
  {
    name: 'duckduckgo',
    label: 'DuckDuckGo',
    description: 'DuckDuckGo is a privacy-focused search engine.',
    icon: `${host}/icons/duckduckgo.svg`,
    category: 'search',
    createdAt: 1722498386,
    background: '#FFFFFF',
    tools: [
      {
        ...duckDuckGoSearchToolDefination,
        fn: createDuckDuckGoSearchTool,
      },
    ],
  },
  {
    name: 'dall-e',
    label: 'Dall-E',
    description: 'DALLE-3 is a text-to-image tool.',
    icon: `${host}/icons/dall-e.png`,
    category: 'image',
    createdAt: 1722498386,
    background: '#E5E7EB',
    tools: [
      {
        ...dallEToolDefination,
        fn: createDallETool,
      },
    ],
  },
  {
    name: 'wikipedia',
    label: 'Wikipedia',
    description:
      'Wikipedia is a free online encyclopedia created and edited by volunteers worldwide.',
    icon: `${host}/icons/wikipedia.svg`,
    category: 'other',
    createdAt: 1722498386,
    background: '#FFFFFF',
    tools: [
      {
        ...wikipediaToolDefination,
        fn: createWikipediaTool,
      },
    ],
  },
  {
    name: 'time',
    label: 'Time',
    description: 'A tool to get the current time',
    icon: `${host}/icons/time.svg`,
    category: 'tool',
    createdAt: 1722498386,
    background: '#E5E7EB',
    tools: [
      {
        ...currentTimeToolDefination,
        fn: createCurrentTimeTool,
      },
    ],
  },
  {
    name: 'gaode',
    label: 'Gaode Tool Package',
    description: 'Built-in Gaode weather forecast and IP query functions.',
    icon: `${host}/icons/gaode.png`,
    category: 'tool',
    createdAt: 1722498386,
    background: '#E5E7EB',
    tools: [
      {
        ...gaodeIpToolDefination,
        fn: createGaodeIpTool,
      },
      {
        ...gaodeWeatherToolDefination,
        fn: createGaodeWeatherTool,
      },
    ],
  },
];

export const getBuiltinToolProvider = (providerName: string) => {
  return builtinTools.find(
    (toolProvider) => toolProvider.name === providerName,
  );
};

export const getBuiltinTool = (provider: BuiltinTool, toolName: string) => {
  return provider.tools.find((tool) => tool.name === toolName);
};
