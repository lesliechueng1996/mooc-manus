export const plannerSystemPrompt = '';

export const formatCreatePlanPrompt = (message: string, attachments: string) =>
  `${message}\n${attachments}`;
