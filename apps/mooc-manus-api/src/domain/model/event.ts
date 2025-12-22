import { randomUUIDv7 } from 'bun';
import { z } from 'zod';
import { fileSchema } from './file';
import { planSchema, stepSchema } from './plan';
import type { ToolResult } from './tool-result';

export enum PlanEventStatus {
  CREATED = 'created',
  UPDATED = 'updated',
  COMPLETED = 'completed',
}

const baseEventSchema = z.object({
  id: z.string().default(randomUUIDv7),
  type: z.string().default(''),
  createdAd: z.date().default(new Date()),
});

export const planEventSchema = baseEventSchema.extend({
  type: z.literal('plan').default('plan'),
  plan: planSchema.default(planSchema.parse({})),
  status: z.enum(PlanEventStatus).default(PlanEventStatus.CREATED),
});

export const titleEventSchema = baseEventSchema.extend({
  type: z.literal('title').default('title'),
  title: z.string().default(''),
});

export enum StepEventStatus {
  STARTED = 'started',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

export const stepEventSchema = baseEventSchema.extend({
  type: z.literal('step').default('step'),
  step: stepSchema.default(stepSchema.parse({})),
  status: z.enum(StepEventStatus).default(StepEventStatus.STARTED),
});

export const messageEventSchema = baseEventSchema.extend({
  type: z.literal('message').default('message'),
  role: z.enum(['user', 'assistant']).default('assistant'),
  message: z.string().default(''),
  attachments: z.array(fileSchema).default([]),
});

type BrowserToolContent = {
  screenshot: string;
};

type MCPToolContent = {
  result: unknown;
};

// TODO: Add more tool content types
type ToolContent = BrowserToolContent | MCPToolContent;

export enum ToolEventStatus {
  CALLING = 'calling',
  CALLED = 'called',
}

export const toolEventSchema = baseEventSchema.extend({
  type: z.literal('tool').default('tool'),
  toolCallId: z.string(),
  toolName: z.string(),
  toolContent: z.custom<ToolContent>().nullable().default(null),
  functionName: z.string(),
  functionArguments: z.record(z.string(), z.unknown()),
  functionResult: z.custom<ToolResult<unknown>>().nullable().default(null),
  status: z.enum(ToolEventStatus).default(ToolEventStatus.CALLING),
});

export const waitEventSchema = baseEventSchema.extend({
  type: z.literal('wait').default('wait'),
});

export const errorEventSchema = baseEventSchema.extend({
  type: z.literal('error').default('error'),
  error: z.string().default(''),
});

export const doneEventSchema = baseEventSchema.extend({
  type: z.literal('done').default('done'),
});

export const eventSchema = z.discriminatedUnion('type', [
  planEventSchema,
  titleEventSchema,
  stepEventSchema,
  messageEventSchema,
  toolEventSchema,
  waitEventSchema,
  errorEventSchema,
  doneEventSchema,
]);

export type Event = z.infer<typeof eventSchema>;
