import {
  type Event,
  MessageEvent,
  StepEvent,
  StepEventStatus,
  ToolEventStatus,
  WaitEvent,
} from '@/domain/model/event';
import { fileSchema } from '@/domain/model/file';
import { type Message, messageSchema } from '@/domain/model/message';
import {
  ExecutionStatus,
  type Plan,
  type Step,
  stepSchema,
} from '@/domain/model/plan';
import {
  formatExecuteStepPrompt,
  reactSystemPrompt,
  summaryPrompt,
} from '../prompts/react';
import { systemPrompt } from '../prompts/system';
import { BaseAgent } from './base';

export class ReActAgent extends BaseAgent {
  protected readonly name: string = 'react';
  protected readonly systemPrompt: string = systemPrompt + reactSystemPrompt;
  protected readonly format: string = 'json_object';

  async *executeStep(
    plan: Plan,
    step: Step,
    message: Message,
  ): AsyncGenerator<Event> {
    const query = formatExecuteStepPrompt(
      message.message,
      message.attachments.join('\n'),
      plan.language,
      step.description,
    );

    step.status = ExecutionStatus.RUNNING;
    yield new StepEvent({
      step,
      status: StepEventStatus.STARTED,
    });

    for await (const event of this.invoke(query)) {
      if (event.type === 'tool') {
        if (event.functionName === 'message_ask_user') {
          if (event.status === ToolEventStatus.CALLING) {
            yield new MessageEvent({
              role: 'assistant',
              // TODO, wait implement message ask user tool
              message: event.functionArguments.text as string,
            });
          } else if (event.status === ToolEventStatus.CALLED) {
            yield new WaitEvent();
            return;
          }
          continue;
        }
      } else if (event.type === 'message') {
        step.status = ExecutionStatus.COMPLETED;
        const parsedObj = this.jsonParser.parse(event.message);
        const newStep = stepSchema.parse(parsedObj);

        step.success = newStep.success;
        step.result = newStep.result;
        step.attachments = newStep.attachments;

        yield new StepEvent({
          step,
          status: StepEventStatus.COMPLETED,
        });

        if (step.result) {
          yield new MessageEvent({
            role: 'assistant',
            message: step.result,
          });
        }
        continue;
      } else if (event.type === 'error') {
        step.status = ExecutionStatus.FAILED;
        step.error = event.error;

        yield new StepEvent({
          step,
          status: StepEventStatus.FAILED,
        });
      }

      yield event;
    }

    step.status = ExecutionStatus.COMPLETED;
  }

  async *summarize(): AsyncGenerator<Event> {
    const query = summaryPrompt;

    for await (const event of this.invoke(query)) {
      if (event.type === 'message') {
        this.logger.info(`ReAct agent summarized, message: ${event.message}`);
        const parsedObj = this.jsonParser.parse(event.message);

        const newMessage = messageSchema.parse(parsedObj);

        const attachments = newMessage.attachments.map((attachment) =>
          fileSchema.parse({
            filepath: attachment,
          }),
        );

        yield new MessageEvent({
          role: 'assistant',
          message: newMessage.message,
          attachments,
        });
      } else {
        yield event;
      }
    }
  }
}
