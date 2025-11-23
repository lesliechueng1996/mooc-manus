import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const stepSchema = z.object({
  id: z.uuid().default(uuidv4),
  description: z.string().default(''),
  status: z.enum(ExecutionStatus).default(ExecutionStatus.PENDING),
  result: z.string().nullable().default(null),
  error: z.string().nullable().default(null),
  success: z.boolean().default(false),
  attachments: z.array(z.string()).default([]),
});

export type StepProps = z.infer<typeof stepSchema>;

export class Step {
  constructor(private readonly props: StepProps) {}

  isDone(): boolean {
    return (
      this.props.status === ExecutionStatus.COMPLETED ||
      this.props.status === ExecutionStatus.FAILED
    );
  }

  static schema = stepSchema.transform((data) => new Step(data));
}

export const planSchema = z.object({
  id: z.uuid().default(uuidv4),
  title: z.string().default(''),
  goal: z.string().default(''),
  language: z.string().default(''),
  steps: z.array(Step.schema).default([]),
  message: z.string().default(''),
  status: z.enum(ExecutionStatus).default(ExecutionStatus.PENDING),
  error: z.string().nullable().default(null),
});

export type PlanProps = z.infer<typeof planSchema>;

export class Plan {
  constructor(private readonly props: PlanProps) {}

  isDone(): boolean {
    return (
      this.props.status === ExecutionStatus.COMPLETED ||
      this.props.status === ExecutionStatus.FAILED
    );
  }

  getNextStep(): Step | undefined {
    return this.props.steps.find((step) => !step.isDone());
  }

  static schema = planSchema.transform((data) => new Plan(data));
}
