import { systemPrompt } from '../prompts/system';
import {
  formatCreatePlanPrompt,
  plannerSystemPrompt,
} from '../prompts/planner';
import { BaseAgent } from './base';
import type { Message } from '@/domain/models/message';
import {
  createPlanEvent,
  PlanEventStatus,
  type Event,
} from '@/domain/models/event';
import { Plan, Step } from '@/domain/models/plan';

const plannerAgentSystemPrompt = systemPrompt + plannerSystemPrompt;

export class PlannerAgent extends BaseAgent {
  protected readonly name: string = 'planner';
  protected readonly systemPrompt: string = plannerAgentSystemPrompt;
  protected readonly format: string = 'json_object';

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

  // async *updatePlan(plan: Plan, step: Step): AsyncGenerator<Event> {}
}
