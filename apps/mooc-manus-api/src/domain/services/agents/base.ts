import { v4 as uuidv4 } from 'uuid';
import type { ParseJson } from '@/domain/external/json-parser';
import type { LlmClient } from '@/domain/external/llm';
import type { AgentConfig } from '@/domain/models/app-config';
import {
  createErrorEvent,
  createToolEvent,
  type Event,
  ToolEventStatus,
} from '@/domain/models/event';
import type { Memory } from '@/domain/models/memory';
import type { ToolResult } from '@/domain/models/tool-result';
import { getContextLogger } from '@/infrasturcture/logging';
import type { BaseTool } from '../tools/base';

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
  tools: Array<BaseTool>;
};

type BaseAgentData = {
  name: string;
  systemPrompt: string;
  format: string | null;
  retryInterval: number;
  toolChoice: string | null;
};

export const createAgent = (
  overrides: Partial<BaseAgentData> & BaseAgentParams,
) => {
  const logger = getContextLogger();

  const agent = {
    name: '',
    systemPrompt: '',
    format: null,
    retryInterval: 1,
    toolChoice: null,
    ...overrides,
  };

  const addToMemory = (messages: Array<Record<string, unknown>>) => {
    if (agent.memory.isEmpty()) {
      agent.memory.addMessage({
        role: 'system',
        content: agent.systemPrompt,
      });
    }
    agent.memory.addMessages(messages);
  };

  const getFormattedTools = () => {
    return agent.tools.map((tool) => tool._toolSchema);
  };

  const invokeLLM = async (
    messages: Array<Record<string, unknown>>,
    format: string | null = null,
  ) => {
    addToMemory(messages);
    const responseFormat = format ? { type: format } : undefined;

    let runIndex = 0;
    while (runIndex < agent.agentConfig.maxRetries) {
      try {
        const message = await agent.llm.invoke({
          messages,
          tools: getFormattedTools(),
          responseFormat,
          toolChoice: agent.toolChoice ?? undefined,
        });

        if (message.role === 'assistant') {
          if (!message.content && !message.tool_calls) {
            logger.warn('Assistant message is empty');
            addToMemory([
              { role: 'assistant', content: '' },
              {
                role: 'user',
                content: 'Assistant message is empty, please try again.',
              },
            ]);
            await new Promise((resolve) =>
              setTimeout(resolve, agent.retryInterval * 1000),
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
          addToMemory([filteredMessage]);
        } else {
          logger.warn(`Unexpected message role: ${message.role}`);
          addToMemory([message]);
        }
        return message;
      } catch (error) {
        logger.error(error, 'Failed to invoke LLM');
        await new Promise((resolve) =>
          setTimeout(resolve, agent.retryInterval * 1000),
        );
      } finally {
        runIndex++;
      }
    }

    throw new Error('Failed to invoke LLM after max retries');
  };

  const getTool = (toolName: string) => {
    return agent.tools.find((tool) => tool._toolName === toolName);
  };

  const invokeTool = async (
    tool: BaseTool,
    toolName: string,
    toolArguments: Record<string, unknown>,
  ): Promise<ToolResult<unknown>> => {
    let toolRetryIndex = 0;
    let finalError: string = '';
    while (toolRetryIndex < agent.agentConfig.maxRetries) {
      try {
        return await tool(toolArguments);
      } catch (error) {
        logger.error(error, `Failed to invoke tool ${toolName}`);
        finalError = error instanceof Error ? error.message : String(error);
        await new Promise((resolve) =>
          setTimeout(resolve, agent.retryInterval * 1000),
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
  };

  const invoke = async function* (
    query: string,
    format: string | null = null,
  ): AsyncGenerator<Event> {
    if (format === null) {
      format = agent.format;
    }

    try {
      let message = await invokeLLM([{ role: 'user', content: query }], format);

      let iterationIndex = 0;
      while (iterationIndex < agent.agentConfig.maxIterations) {
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
          const functionArguments = agent.parseJson(
            toolCall.function.arguments,
          ) as Record<string, unknown>;
          const tool = getTool(functionName);
          if (!tool) {
            continue;
          }

          yield createToolEvent({
            toolCallId,
            toolName: tool._toolName,
            functionName,
            functionArguments,
            status: ToolEventStatus.CALLING,
          });

          const result = await invokeTool(
            tool,
            functionName,
            functionArguments,
          );

          yield createToolEvent({
            toolCallId,
            toolName: tool._toolName,
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

        message = await invokeLLM(toolMessages);
      }

      if (iterationIndex >= agent.agentConfig.maxIterations) {
        yield createErrorEvent({
          error: `Agent reached the maximum number of iterations: ${agent.agentConfig.maxIterations}`,
        });
      }
    } catch (error) {
      yield createErrorEvent({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  };

  const getMemory = () => {
    return agent.memory;
  };

  const compactMemory = () => {
    agent.memory.compact();
  };

  return {
    invoke,
    getMemory,
    compactMemory,
  };
};
