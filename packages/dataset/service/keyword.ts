import { Jieba, TfIdf } from '@node-rs/jieba';
import { dict, idf } from '@node-rs/jieba/dict';

const jieba = Jieba.withDict(dict);
const tfIdf = TfIdf.withDict(idf);

export const extractKeywords = (text: string, maxKeywords = 10) => {
  const keywords = tfIdf.extractKeywords(jieba, text, maxKeywords);
  return keywords.map((item) => item.keyword);
};
