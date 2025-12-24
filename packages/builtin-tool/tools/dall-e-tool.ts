import { getLogger } from '@repo/common';
import {
  DallEAPIWrapper,
  type DallEAPIWrapperParams,
} from '@repo/internal-langchain/openai';

const defaultOptions = {
  apiKey: process.env.OPENAI_API_KEY,
  model: 'dall-e-3',
};

const defaultDallETool = new DallEAPIWrapper(defaultOptions);

type CustomDallEAPIWrapperParams = Pick<
  DallEAPIWrapperParams,
  'size' | 'style'
>;

export const createDallETool = (params: CustomDallEAPIWrapperParams) => {
  const logger = getLogger();
  logger.info('Create DALL-E tool instance, params: %o', params);
  return new DallEAPIWrapper({
    ...defaultOptions,
    ...params,
  });
};

export const dallEToolDefination = {
  name: defaultDallETool.name,
  description: defaultDallETool.description,
  inputs: [
    {
      name: 'input',
      description: 'Description of the image to generate',
      required: true,
      type: 'string' as const,
    },
  ],
  label: 'Dall-E image generation',
  params: [
    {
      name: 'size',
      label: 'Image size',
      required: true,
      type: 'select' as const,
      default: '1024x1024',
      options: [
        {
          value: '1024x1024',
          label: '(Square) 1024x1024',
        },
        {
          value: '1792x1024',
          label: '(Landscape) 1792x1024',
        },
        {
          value: '1024x1792',
          label: '(Portrait) 1024x1792',
        },
      ],
    },
    {
      name: 'style',
      label: 'Image style',
      required: true,
      type: 'select' as const,
      default: 'vivid',
      options: [
        {
          value: 'vivid',
          label: 'Vivid',
        },
        {
          value: 'natural',
          label: 'Natural',
        },
      ],
    },
  ],
  createdAt: 1722498386,
};
