import nodejieba from 'nodejieba';

if (typeof globalThis !== 'undefined' && !('window' in globalThis)) {
  nodejieba.load();
}

export const extractKeywords = (text: string, maxKeywords = 10) => {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    throw new Error('关键词提取功能只能在服务器端运行');
  }

  const keywords = nodejieba.extract(text, maxKeywords);
  return keywords.map((item) => item.word);
};
