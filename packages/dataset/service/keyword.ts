import nodejieba from 'nodejieba';

if (typeof globalThis !== 'undefined' && !('window' in globalThis)) {
  nodejieba.load();
}

export const extractKeywords = (text: string, maxKeywords = 10) => {
  if (typeof globalThis !== 'undefined' && 'window' in globalThis) {
    throw new Error('Only can be used in server side');
  }

  const keywords = nodejieba.extract(text, maxKeywords);
  return keywords.map((item) => item.word);
};
