import {
  createPlanEvent,
  type Event,
  PlanEventStatus,
} from '@/domain/models/event';
import type { Message } from '@/domain/models/message';
import { Plan, type Step } from '@/domain/models/plan';
import {
  formatCreatePlanPrompt,
  formatUpdatePlanPrompt,
  plannerSystemPrompt,
} from '../prompts/planner';
import { systemPrompt } from '../prompts/system';
import { BaseAgent } from './base';

const plannerAgentSystemPrompt = systemPrompt + plannerSystemPrompt;

export class PlannerAgent extends BaseAgent {
  protected readonly name: string = 'planner';
  protected readonly systemPrompt: string = plannerAgentSystemPrompt;
  protected readonly format: string = 'json_object';
  protected readonly toolChoice: string = 'none';

  async *createPlan(message: Message): AsyncGenerator<Event> {
    const query = formatCreatePlanPrompt(
      message.message,
      message.attachments.join('\n'),
    );

    for await (const event of this.invoke(query)) {
      if (event.type === 'message') {
        this.logger.info(
          { message: event.message },
          'Planner agent generated plan',
        );

        const parsedJson = this.parseJson(event.message);
        const plan = Plan.schema.parse(parsedJson);

        yield createPlanEvent({
          plan,
          status: PlanEventStatus.CREATED,
        });
      } else {
        yield event;
      }
    }
  }

  async *updatePlan(plan: Plan, step: Step): AsyncGenerator<Event> {
    const query = formatUpdatePlanPrompt(
      JSON.stringify(plan),
      JSON.stringify(step),
    );

    for await (const event of this.invoke(query)) {
      if (event.type === 'message') {
        this.logger.info(
          { message: event.message },
          'Planner agent updated plan',
        );

        const parsedJson = this.parseJson(event.message);
        const updatePlan = Plan.schema.parse(parsedJson);

        const newSteps = updatePlan.steps.map((step) => step.clone());

        const firstUnfinishedIndex = plan.steps.findIndex(
          (step) => !step.isDone(),
        );

        if (firstUnfinishedIndex >= 0) {
          const updatedSteps = plan.steps
            .slice(0, firstUnfinishedIndex)
            .concat(newSteps);
          plan.steps = updatedSteps;
        }

        yield createPlanEvent({
          plan,
          status: PlanEventStatus.UPDATED,
        });
      } else {
        yield event;
      }
    }
  }
}
