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
  T extends (arg: unknown) => Promise<ToolResult<unknown>>,
> {
  _toolName: string;
  _toolDescription: string;
  _toolSchema: ToolSchema;
  (arg: Parameters<T>[0]): ReturnType<T>;
}

export const createTool = <
  T extends (arg: unknown) => Promise<ToolResult<unknown>>,
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

export type Tool = ToolFunction<(arg: unknown) => Promise<ToolResult<unknown>>>;

const filterToolParameters = (
  func: ToolFunction<(arg: unknown) => Promise<ToolResult<unknown>>>,
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

export const createToolCollection = (name: string) => {
  const tools: Array<Tool> = [];
  const collectionName = name;

  const registerTool = <
    T extends (arg: unknown) => Promise<ToolResult<unknown>>,
  >(
    tool: ToolFunction<T>,
  ) => {
    tools.push(tool);
  };

  const hasTool = (toolName: string) => {
    return tools.some((tool) => tool._toolName === toolName);
  };

  const getTools = () => tools;

  const invokeTool = async (
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

  return {
    registerTool,
    hasTool,
    getTools,
    invokeTool,
    collectionName,
  };
};

export type ToolCollection = ReturnType<typeof createToolCollection>;
