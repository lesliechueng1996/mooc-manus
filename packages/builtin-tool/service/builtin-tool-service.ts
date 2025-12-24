import { builtinTools } from '../tools';

export { getBuiltinToolCategories } from './category-service';

export const getBuiltinTools = () => {
  return builtinTools.map((provider) => ({
    name: provider.name,
    label: provider.label,
    description: provider.description,
    icon: provider.icon,
    category: provider.category,
    createdAt: provider.createdAt,
    background: provider.background,
    tools: provider.tools.map((tool) => ({
      name: tool.name,
      label: tool.label,
      description: tool.description,
      inputs: tool.inputs,
      params: tool.params,
    })),
  }));
};

export const getBuiltinToolProvider = (providerName: string) => {
  return builtinTools.find((provider) => provider.name === providerName);
};

export const getBuiltinTool = (
  provider: ReturnType<typeof getBuiltinToolProvider>,
  toolName: string,
) => {
  if (!provider) {
    return null;
  }
  return provider.tools.find((tool) => tool.name === toolName);
};

export const getBuiltinToolInfo = (providerName: string, toolName: string) => {
  const provider = getBuiltinToolProvider(providerName);
  if (!provider) {
    throw new Error('Provider not found');
  }
  const tool = getBuiltinTool(provider, toolName);
  if (!tool) {
    throw new Error('Tool not found');
  }

  return {
    provider: {
      name: provider.name,
      label: provider.label,
      description: provider.description,
      icon: provider.icon,
      category: provider.category,
      background: provider.background,
    },
    name: tool.name,
    label: tool.label,
    description: tool.description,
    inputs: tool.inputs,
    params: tool.params,
    createdAt: tool.createdAt,
  };
};
