import type { ToolResult } from '@/domain/models/tool-result';

export type ToolSchema = {
  type: 'function';
  function: {
    name: string;
    description: string;
    parameters: {
      type: 'object';
      properties: Record<string, Record<string, unknown>>;
      required: Array<string>;
    };
  };
};

export interface ToolFunction<
  T extends (...args: unknown[]) => Promise<ToolResult<unknown>>,
> {
  _toolName: string;
  _toolDescription: string;
  _toolSchema: ToolSchema;
  (...args: Parameters<T>): ReturnType<T>;
}

export const createTool = <
  T extends (...args: unknown[]) => Promise<ToolResult<unknown>>,
>(
  func: T,
  name: string,
  description: string,
  parameters: Record<string, Record<string, unknown>>,
  required: Array<string>,
): ToolFunction<T> => {
  const toolSchema: ToolSchema = {
    type: 'function',
    function: {
      name,
      description,
      parameters: {
        type: 'object',
        properties: parameters,
        required: required,
      },
    },
  };

  const toolFunc = func as unknown as ToolFunction<T>;
  toolFunc._toolName = name;
  toolFunc._toolDescription = description;
  toolFunc._toolSchema = toolSchema;

  return toolFunc;
};

const tools: Array<
  ToolFunction<(...args: unknown[]) => Promise<ToolResult<unknown>>>
> = [];

export const registerTool = <
  T extends (...args: unknown[]) => Promise<ToolResult<unknown>>,
>(
  tool: ToolFunction<T>,
) => {
  tools.push(tool);
};

export const hasTool = (toolName: string) => {
  return tools.some((tool) => tool._toolName === toolName);
};

export const getTools = () => tools;

const filterToolParameters = (
  func: ToolFunction<(...args: unknown[]) => Promise<ToolResult<unknown>>>,
  parameters: Record<string, unknown>,
) => {
  const toolSchema = func._toolSchema;
  const filteredParameters: Record<string, unknown> = {};
  for (const property in parameters) {
    if (toolSchema.function.parameters.properties[property]) {
      filteredParameters[property] = parameters[property];
    }
  }

  return filteredParameters;
};

export const invokeTool = async (
  toolName: string,
  parameters: Record<string, unknown>,
): Promise<ToolResult<unknown> | null> => {
  const tool = tools.find((tool) => tool._toolName === toolName);
  if (!tool) {
    throw new Error(`Tool ${toolName} not found`);
  }

  const filteredParameters = filterToolParameters(tool, parameters);
  const result = await tool(filteredParameters);
  return result;
};
