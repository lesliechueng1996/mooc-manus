import { v4 as uuidv4 } from 'uuid';

export enum ExecutionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export type StepData = {
  id: string;
  description: string;
  status: ExecutionStatus;
  result: string | null;
  error: string | null;
  success: boolean;
  attachments: Array<string>;
};

export const createStep = (overrides?: Partial<StepData>) => {
  const step: StepData = {
    id: uuidv4(),
    description: '',
    status: ExecutionStatus.PENDING,
    result: null,
    error: null,
    success: false,
    attachments: [],
    ...overrides,
  };

  const isDone = (): boolean => {
    return (
      step.status === ExecutionStatus.COMPLETED ||
      step.status === ExecutionStatus.FAILED
    );
  };

  return {
    isDone,
  };
};

export type Step = ReturnType<typeof createStep>;

export type PlanData = {
  id: string;
  title: string;
  goal: string;
  language: string;
  steps: Array<Step>;
  message: string;
  status: ExecutionStatus;
  error: string | null;
};

export const createPlan = (overrides?: Partial<PlanData>) => {
  const plan: PlanData = {
    id: uuidv4(),
    title: '',
    goal: '',
    language: '',
    steps: [],
    message: '',
    status: ExecutionStatus.PENDING,
    error: null,
    ...overrides,
  };

  const isDone = (): boolean => {
    return (
      plan.status === ExecutionStatus.COMPLETED ||
      plan.status === ExecutionStatus.FAILED
    );
  };

  const getNextStep = () => {
    return plan.steps.find((step) => !step.isDone());
  };

  return {
    isDone,
    getNextStep,
  };
};

export type Plan = ReturnType<typeof createPlan>;
