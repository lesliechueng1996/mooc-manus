import { randomUUIDv7 } from 'bun';
import { z } from 'zod';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const stepSchema = z.object({
  id: z.string().default(randomUUIDv7),
  description: z.string().default(''),
  status: z.enum(ExecutionStatus).default(ExecutionStatus.PENDING),
  result: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
  success: z.boolean().default(false),
  attachments: z.array(z.string()).default([]),
});

export type Step = z.infer<typeof stepSchema>;

export const isStepDone = (step: Step) => {
  return (
    step.status === ExecutionStatus.COMPLETED ||
    step.status === ExecutionStatus.FAILED
  );
};

export const cloneStep = (step: Step) => {
  return stepSchema.parse(step);
};

export const planSchema = z.object({
  id: z.string().default(randomUUIDv7),
  title: z.string().default(''),
  goal: z.string().default(''),
  language: z.string().default(''),
  steps: z.array(stepSchema).default([]),
  message: z.string().default(''),
  status: z.enum(ExecutionStatus).default(ExecutionStatus.PENDING),
  error: z.string().nullable().default(null),
});

export type Plan = z.infer<typeof planSchema>;

export const isPlanDone = (plan: Plan) => {
  return (
    plan.status === ExecutionStatus.COMPLETED ||
    plan.status === ExecutionStatus.FAILED
  );
};

export const getPlanNextStep = (plan: Plan) => {
  return plan.steps.find((step) => !isStepDone(step));
};
