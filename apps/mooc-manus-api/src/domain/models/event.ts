import { v4 as uuidv4 } from 'uuid';
import type { File } from './file';
import type { Plan, Step } from './plan';
import { createPlan, createStep } from './plan';
import type { ToolResult } from './tool-result';

enum PlanEventStatus {
  CREATED = 'created',
  UPDATED = 'updated',
  COMPLETED = 'completed',
}

type BaseEvent = {
  id: string;
  type: string;
  createdAt: Date;
};

const createBaseEvent = (overrides?: Partial<BaseEvent>) => {
  const event: BaseEvent = {
    id: uuidv4(),
    type: '',
    createdAt: new Date(),
    ...overrides,
  };

  return event;
};

type PlanEvent = BaseEvent & {
  type: 'plan';
  plan: Plan;
  status: PlanEventStatus;
};

export const createPlanEvent = (overrides?: Partial<PlanEvent>) => {
  const event: PlanEvent = {
    ...createBaseEvent(),
    type: 'plan',
    plan: createPlan(),
    status: PlanEventStatus.CREATED,
    ...overrides,
  };

  return event;
};

type TitleEvent = BaseEvent & {
  type: 'title';
  title: string;
};

export const createTitleEvent = (overrides?: Partial<TitleEvent>) => {
  const event: TitleEvent = {
    ...createBaseEvent(),
    type: 'title',
    title: '',
    ...overrides,
  };

  return event;
};

enum StepEventStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

type StepEvent = BaseEvent & {
  type: 'step';
  step: Step;
  status: StepEventStatus;
};

export const createStepEvent = (overrides?: Partial<StepEvent>) => {
  const event: StepEvent = {
    ...createBaseEvent(),
    type: 'step',
    step: createStep(),
    status: StepEventStatus.STARTED,
    ...overrides,
  };

  return event;
};

type MessageEvent = BaseEvent & {
  type: 'message';
  role: 'user' | 'assistant';
  message: string;
  attachments: Array<File>;
};

export const createMessageEvent = (overrides?: Partial<MessageEvent>) => {
  const event: MessageEvent = {
    ...createBaseEvent(),
    type: 'message',
    role: 'assistant',
    message: '',
    attachments: [],
    ...overrides,
  };

  return event;
};

type BrowserToolContent = {
  screenshot: string;
};

type MCPToolContent = {
  result: unknown;
};

// TODO: Add more tool content types
type ToolContent = BrowserToolContent | MCPToolContent;

enum ToolEventStatus {
  CALLING = 'calling',
  CALLED = 'called',
}

type ToolEvent = BaseEvent & {
  type: 'tool';
  toolCallId: string;
  toolName: string;
  toolContent: ToolContent | null;
  functionName: string;
  functionArguments: Record<string, unknown>;
  functionResult: ToolResult<unknown> | null;
  status: ToolEventStatus;
};

export const createToolEvent = (
  overrides: Partial<ToolEvent> &
    Pick<
      ToolEvent,
      'toolCallId' | 'toolName' | 'functionName' | 'functionArguments'
    >,
) => {
  const event: ToolEvent = {
    ...createBaseEvent(),
    type: 'tool',
    toolContent: null,
    functionResult: null,
    status: ToolEventStatus.CALLING,
    ...overrides,
  };

  return event;
};

// Wait human confirmation or action
type WaitEvent = BaseEvent & {
  type: 'wait';
};

export const createWaitEvent = () => {
  const event: WaitEvent = {
    ...createBaseEvent(),
    type: 'wait',
  };

  return event;
};

type ErrorEvent = BaseEvent & {
  type: 'error';
  error: string;
};

export const createErrorEvent = (overrides?: Partial<ErrorEvent>) => {
  const event: ErrorEvent = {
    ...createBaseEvent(),
    type: 'error',
    error: '',
    ...overrides,
  };

  return event;
};

type DoneEvent = BaseEvent & {
  type: 'done';
};

export const createDoneEvent = () => {
  const event: DoneEvent = {
    ...createBaseEvent(),
    type: 'done',
  };

  return event;
};

export type Event =
  | PlanEvent
  | TitleEvent
  | StepEvent
  | MessageEvent
  | ToolEvent
  | WaitEvent
  | ErrorEvent
  | DoneEvent;
