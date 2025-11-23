export const plannerSystemPrompt = '';

export const formatCreatePlanPrompt = (message: string, attachments: string) =>
  `${message}\n${attachments}`;

export const formatUpdatePlanPrompt = (plan: string, step: string) =>
  `${plan}\n${step}`;
