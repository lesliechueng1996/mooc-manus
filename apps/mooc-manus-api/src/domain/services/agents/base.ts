import type { Logger } from '@repo/pino-log';
import { v4 as uuidv4 } from 'uuid';
import type { ParseJson } from '@/domain/external/json-parser';
import type { LlmClient } from '@/domain/external/llm';
import type { AgentConfig } from '@/domain/models/app-config';
import {
  createErrorEvent,
  createMessageEvent,
  createToolEvent,
  type Event,
  ToolEventStatus,
} from '@/domain/models/event';
import type { Memory } from '@/domain/models/memory';
import type { Message } from '@/domain/models/message';
import type { ToolResult } from '@/domain/models/tool-result';
import { getContextLogger } from '@/infrasturcture/logging';
import type { ToolCollection } from '../tools/base';

type ToolCall = {
  id: string;
  type: 'function';
  function?: {
    name: string;
    arguments: string;
  };
};

type BaseAgentParams = {
  agentConfig: AgentConfig;
  llm: LlmClient;
  memory: Memory;
  parseJson: ParseJson;
  tools: Array<ToolCollection>;
};

type BaseAgentData = {
  name: string;
  systemPrompt: string;
  format: string | null;
  retryInterval: number;
  toolChoice: string | null;
};

export class BaseAgent {
  protected readonly name: string = '';
  protected readonly systemPrompt: string = '';
  protected readonly format: string | null = null;
  protected readonly retryInterval: number = 1;
  protected readonly toolChoice: string | null = null;

  protected readonly agentConfig: AgentConfig;
  protected readonly llm: LlmClient;
  protected readonly memory: Memory;
  protected readonly parseJson: ParseJson;
  protected readonly tools: Array<ToolCollection>;

  protected readonly logger: Logger;

  constructor(params: BaseAgentParams, overrides: Partial<BaseAgentData> = {}) {
    Object.assign(this, overrides);
    this.agentConfig = params.agentConfig;
    this.llm = params.llm;
    this.memory = params.memory;
    this.parseJson = params.parseJson;
    this.tools = params.tools;
    this.logger = getContextLogger();
  }

  protected addToMemory(messages: Array<Record<string, unknown>>) {
    if (this.memory.isEmpty()) {
      this.memory.addMessage({
        role: 'system',
        content: this.systemPrompt,
      });
    }
    this.memory.addMessages(messages);
  }

  protected getFormattedTools() {
    return this.tools
      .flatMap((tool) => tool.getTools())
      .map((tool) => tool._toolSchema);
  }

  protected async invokeLLM(
    messages: Array<Record<string, unknown>>,
    format: string | null = null,
  ) {
    this.addToMemory(messages);
    const responseFormat = format ? { type: format } : undefined;

    let runIndex = 0;
    while (runIndex < this.agentConfig.maxRetries) {
      try {
        const message = await this.llm.invoke({
          messages,
          tools: this.getFormattedTools(),
          responseFormat,
          toolChoice: this.toolChoice ?? undefined,
        });

        if (message.role === 'assistant') {
          if (!message.content && !message.tool_calls) {
            this.logger.warn('Assistant message is empty');
            this.addToMemory([
              { role: 'assistant', content: '' },
              {
                role: 'user',
                content: 'Assistant message is empty, please try again.',
              },
            ]);
            await new Promise((resolve) =>
              setTimeout(resolve, this.retryInterval * 1000),
            );
            continue;
          }
          const filteredMessage: {
            role: string;
            content: string;
            tool_calls: Array<ToolCall> | null;
          } = {
            role: 'assistant',
            content: message.content as string,
            tool_calls: null,
          };
          if (message.tool_calls && Array.isArray(message.tool_calls)) {
            // Only call 1 tool at a time
            filteredMessage.tool_calls = [message.tool_calls[0]];
          }
          this.addToMemory([filteredMessage]);
        } else {
          this.logger.warn(`Unexpected message role: ${message.role}`);
          this.addToMemory([message]);
        }
        return message;
      } catch (error) {
        this.logger.error(error, 'Failed to invoke LLM');
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryInterval * 1000),
        );
      } finally {
        runIndex++;
      }
    }

    throw new Error('Failed to invoke LLM after max retries');
  }

  protected getTool(toolName: string) {
    return this.tools.find((tool) => tool.collectionName === toolName);
  }

  protected async invokeTool(
    toolCollection: ToolCollection,
    toolName: string,
    toolArguments: Record<string, unknown>,
  ): Promise<ToolResult<unknown>> {
    let toolRetryIndex = 0;
    let finalError: string = '';
    while (toolRetryIndex < this.agentConfig.maxRetries) {
      try {
        const result = await toolCollection.invokeTool(toolName, toolArguments);
        if (!result) {
          throw new Error(`Failed to invoke tool ${toolName}`);
        }
        return result;
      } catch (error) {
        this.logger.error(error, `Failed to invoke tool ${toolName}`);
        finalError = error instanceof Error ? error.message : String(error);
        await new Promise((resolve) =>
          setTimeout(resolve, this.retryInterval * 1000),
        );
      } finally {
        toolRetryIndex++;
      }
    }

    return {
      success: false,
      message: finalError,
      data: null,
    };
  }

  protected async *invoke(
    query: string,
    format: string | null = null,
  ): AsyncGenerator<Event> {
    if (format === null) {
      format = this.format;
    }

    try {
      let message = await this.invokeLLM(
        [{ role: 'user', content: query }],
        format,
      );

      let iterationIndex = 0;
      while (iterationIndex < this.agentConfig.maxIterations) {
        iterationIndex++;

        if (!message.tool_calls) {
          break;
        }

        const toolMessages: Array<Record<string, unknown>> = [];
        for (const toolCall of message.tool_calls as Array<ToolCall>) {
          if (!toolCall.function) {
            continue;
          }
          const toolCallId = toolCall.id || uuidv4();
          const functionName = toolCall.function.name;
          const functionArguments = this.parseJson(
            toolCall.function.arguments,
          ) as Record<string, unknown>;
          const tool = this.getTool(functionName);
          if (!tool) {
            continue;
          }

          yield createToolEvent({
            toolCallId,
            toolName: tool.collectionName,
            functionName,
            functionArguments,
            status: ToolEventStatus.CALLING,
          });

          const result = await this.invokeTool(
            tool,
            functionName,
            functionArguments,
          );

          yield createToolEvent({
            toolCallId,
            toolName: tool.collectionName,
            functionName,
            functionArguments,
            functionResult: result,
            status: ToolEventStatus.CALLED,
          });

          toolMessages.push({
            role: 'tool',
            tool_call_id: toolCallId,
            function_name: functionName,
            content: JSON.stringify(result),
          });
        }

        message = await this.invokeLLM(toolMessages);
      }

      if (iterationIndex >= this.agentConfig.maxIterations) {
        yield createErrorEvent({
          error: `Agent reached the maximum number of iterations: ${this.agentConfig.maxIterations}`,
        });
      } else {
        yield createMessageEvent({
          message: message.content as string,
        });
      }
    } catch (error) {
      yield createErrorEvent({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  protected getMemory() {
    return this.memory;
  }

  protected compactMemory() {
    this.memory.compact();
  }

  protected rollBack(message: Message) {
    const lastMessage = this.memory.getLastMessage() as Record<string, unknown>;
    if (
      !lastMessage ||
      !lastMessage.tool_calls ||
      (Array.isArray(lastMessage.tool_calls) &&
        lastMessage.tool_calls.length === 0)
    ) {
      return;
    }
    const toolCall = (lastMessage.tool_calls as Array<ToolCall>)[0];
    const functionName = toolCall.function?.name;
    const toolCallId = toolCall.id;
    if (functionName === 'message_ask_user') {
      this.memory.addMessage({
        role: 'tool',
        tool_call_id: toolCallId,
        function_name: functionName,
        content: JSON.stringify(message),
      });
    } else {
      this.memory.rollBack();
    }
  }
}
