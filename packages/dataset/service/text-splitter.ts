import { RecursiveCharacterTextSplitter } from '@repo/internal-langchain';
import type { Prisma } from '@repo/prisma-database';
import { PreProcessRuleId } from '../types';

type Rule = {
  preProcessRules: {
    id: PreProcessRuleId;
    enabled: boolean;
  }[];
  segment: {
    separators: string[];
    chunkSize: number;
    chunkOverlap: number;
  };
};

export const createTextSplitter = (
  processRuleRecord: Prisma.ProcessRuleModel,
  lengthFunction: (text: string) => number,
) => {
  const rule = processRuleRecord.rule as Rule;
  return new RecursiveCharacterTextSplitter({
    chunkSize: rule.segment.chunkSize,
    chunkOverlap: rule.segment.chunkOverlap,
    separators: rule.segment.separators,
    lengthFunction,
  });
};

export const cleanText = (
  processRuleRecord: Prisma.ProcessRuleModel,
  text: string,
) => {
  const rule = processRuleRecord.rule as Rule;
  let cleanedText = text;
  for (const preProcessRule of rule.preProcessRules) {
    if (
      preProcessRule.id === PreProcessRuleId.RemoveExtraSpace &&
      preProcessRule.enabled
    ) {
      // Replace 3 or more consecutive line breaks with 2 line breaks
      cleanedText = cleanedText.replace(/\n{3}/g, '\n\n');
      // Replace 2 or more consecutive whitespace characters (including tab, form feed, carriage return, space, etc. Unicode whitespace characters) with a single space
      cleanedText = cleanedText.replace(
        /[\t\f\r\x20\u00a0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000]{2,}/g,
        ' ',
      );
    }

    if (
      preProcessRule.id === PreProcessRuleId.RemoveUrlAndEmail &&
      preProcessRule.enabled
    ) {
      // Remove email addresses
      // Match format: username@domain.tld
      cleanedText = cleanedText.replace(
        /[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g,
        '',
      );
      // Remove URL and mailto links
      // Match URLs starting with http:// or https://, and mailto: links
      cleanedText = cleanedText.replace(/https?:\/\/[^\s]+|mailto:[^\s]+/g, '');
    }
  }
  return cleanedText;
};
