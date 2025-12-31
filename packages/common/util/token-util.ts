import { encoding_for_model as encodingForModel } from 'tiktoken';

export const calculateTokenCount = (text: string) => {
  const encoding = encodingForModel('gpt-4o-mini');
  const tokens = encoding.encode(text);
  encoding.free();
  return tokens.length;
};
