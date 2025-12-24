import { InternalServerErrorException } from '@repo/common';
import OpenAI, { type ClientOptions } from 'openai';
import type { ChatCompletion } from 'openai/resources';
import type { ChatCompletionCreateParamsBase } from 'openai/resources/chat/completions';
import type { LlmClient } from '@/domain/external/llm';
import type { LlmConfig } from '@/domain/model/app-config';
import type { Logger } from '@/infrastructure/logging';

export class OpenAILLMClient implements LlmClient {
  private readonly client: OpenAI;
  readonly modelName: string;
  readonly temperature: number;
  readonly maxTokens: number;

  constructor(
    private readonly logger: Logger,
    private readonly llmConfig: LlmConfig,
    private readonly openaiConfig: Partial<ClientOptions> = {},
  ) {
    this.client = new OpenAI({
      baseURL: this.llmConfig.baseUrl,
      apiKey: this.llmConfig.apiKey,
      ...this.openaiConfig,
    });

    const { modelName, temperature, maxTokens } = this.llmConfig;
    this.modelName = modelName;
    this.temperature = temperature;
    this.maxTokens = maxTokens;
  }

  async invoke(params: {
    messages: Array<Record<string, unknown>>;
    tools?: Array<Record<string, unknown>>;
    responseFormat?: Record<string, unknown>;
    toolChoice?: string;
  }): Promise<Record<string, unknown>> {
    try {
      const { messages, tools, responseFormat, toolChoice } = params;

      const openaiParams = {
        model: this.modelName,
        temperature: this.temperature,
        max_completion_tokens: this.maxTokens,
        messages,
        response_format: responseFormat,
      } as unknown as ChatCompletionCreateParamsBase;

      if (tools && tools.length > 0) {
        this.logger.info(`Tools are provided, model name ${this.modelName}`);
        Object.assign(openaiParams, {
          tools,
          tool_choice: toolChoice,
          parallel_tool_calls: false,
        });
      } else {
        this.logger.info(`No tools are provided, model name ${this.modelName}`);
      }

      const response = (await this.client.chat.completions.create(
        openaiParams,
      )) as ChatCompletion;
      this.logger.info(`OpenAI Response: ${JSON.stringify(response)}`);
      return response.choices[0].message as unknown as Record<string, unknown>;
    } catch (error) {
      this.logger.error('Failed to invoke OpenAI Client', { error });
      throw new InternalServerErrorException('Failed to invoke OpenAI Client');
    }
  }
}
