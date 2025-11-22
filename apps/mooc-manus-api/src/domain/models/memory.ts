import { getContextLogger } from '@/infrasturcture/logging';

type Message = {
  role: string;
  content: string;
} & {
  role: 'tool';
  functionName: string;
} & Record<string, unknown>;

// TODO: Implement this
const compactFunctionNames = [''];

export const createMemory = async () => {
  const logger = getContextLogger();
  const messages: Array<Message> = [];

  const addMessage = (message: Message) => {
    messages.push(message);
  };

  const addMessages = (messages: Array<Message>) => {
    messages.push(...messages);
  };

  const getMessages = () => {
    return messages;
  };

  const getLastMessage = () => {
    if (messages.length === 0) {
      return null;
    }
    return messages[messages.length - 1];
  };

  const rollBack = () => {
    messages.pop();
  };

  const compact = () => {
    for (const message of messages) {
      if (getMessageRole(message) === 'tool') {
        if (compactFunctionNames.includes(message.functionName)) {
          // TODO: Implement this
          message.content = '(removed)';
          logger.info(
            `Removed tool call message, function name: ${message.functionName}`,
          );
        }
      }
    }
  };

  const isEmpty = () => {
    return messages.length === 0;
  };

  return {
    addMessage,
    addMessages,
    getMessages,
    getLastMessage,
    rollBack,
    compact,
    isEmpty,
  };
};

export const getMessageRole = (message: Record<string, unknown>) => {
  return message.role as string;
};
