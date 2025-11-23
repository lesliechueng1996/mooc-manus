import OpenAI, { type ClientOptions } from 'openai';
import type { ChatCompletion } from 'openai/resources';
import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import { InternalServerErrorException } from '@/application/error/exception';
import type { LlmClient } from '@/domain/external/llm';
import type { LlmConfig } from '@/domain/models/app-config';
import { getContextLogger } from '@/infrasturcture/logging/index';

export const createClient = (
  llmConfig: LlmConfig,
  openaiConfig: Partial<ClientOptions> = {},
): LlmClient => {
  const logger = getContextLogger();

  const client = new OpenAI({
    baseURL: llmConfig.baseUrl,
    apiKey: llmConfig.apiKey,
    ...openaiConfig,
  });

  const { modelName, temperature, maxTokens } = llmConfig;
  // const timeout = 3600;

  const invoke: LlmClient['invoke'] = async (params) => {
    try {
      const { messages, tools, responseFormat, toolChoice } = params;

      const openaiParams = {
        model: modelName,
        temperature,
        max_completion_tokens: maxTokens,
        messages,
        response_format: responseFormat,
      } as unknown as ChatCompletionCreateParamsBase;

      if (tools && tools.length > 0) {
        logger.info(`Tools are provided, model name ${modelName}`);
        Object.assign(openaiParams, {
          tools,
          tool_choice: toolChoice,
          parallel_tool_calls: false,
        });
      } else {
        logger.info(`No tools are provided, model name ${modelName}`);
      }

      const response = (await client.chat.completions.create(
        openaiParams,
      )) as ChatCompletion;
      logger.info(`OpenAI Response: ${JSON.stringify(response)}`);
      return response.choices[0].message as unknown as Record<string, unknown>;
    } catch (error) {
      logger.error(error, 'Failed to invoke OpenAI Client');
      throw new InternalServerErrorException('Failed to invoke OpenAI Client');
    }
  };

  return {
    modelName,
    temperature,
    maxTokens,
    invoke,
  };
};
