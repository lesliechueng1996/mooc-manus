import { PreProcessRuleId } from './types';

export const DEFAULT_PROCESS_RULE = {
  mode: 'custom',
  rule: {
    preProcessRules: [
      { id: PreProcessRuleId.RemoveExtraSpace, enabled: true },
      { id: PreProcessRuleId.RemoveUrlAndEmail, enabled: true },
    ],
    segment: {
      separators: [
        '\n\n',
        '\n',
        '。',
        '！',
        '？',
        '.',
        '!',
        '?',
        '；',
        ';',
        '，',
        ',',
        ' ',
        '',
      ],
      chunkSize: 500,
      chunkOverlap: 50,
    },
  },
};
