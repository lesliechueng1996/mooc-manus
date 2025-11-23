import {
  createMessageEvent,
  createStepEvent,
  createWaitEvent,
  type Event,
  StepEventStatus,
  ToolEventStatus,
} from '@/domain/models/event';
import { File } from '@/domain/models/file';
import { Message } from '@/domain/models/message';
import { ExecutionStatus, type Plan, Step } from '@/domain/models/plan';
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
    yield createStepEvent({
      step,
      status: StepEventStatus.STARTED,
    });

    for await (const event of this.invoke(query)) {
      if (event.type === 'tool') {
        if (event.functionName === 'message_ask_user') {
          if (event.status === ToolEventStatus.CALLING) {
            yield createMessageEvent({
              role: 'assistant',
              // TODO, wait implement message ask user tool
              message: event.functionArguments.text as string,
            });
          } else if (event.status === ToolEventStatus.CALLED) {
            yield createWaitEvent();
            return;
          }
          continue;
        }
      } else if (event.type === 'message') {
        step.status = ExecutionStatus.COMPLETED;
        const parsedObj = this.parseJson(event.message);
        const newStep = Step.schema.parse(parsedObj);

        step.success = newStep.success;
        step.result = newStep.result;
        step.attachments = newStep.attachments;

        yield createStepEvent({
          step,
          status: StepEventStatus.COMPLETED,
        });

        if (step.result) {
          yield createMessageEvent({
            role: 'assistant',
            message: step.result,
          });
        }
        continue;
      } else if (event.type === 'error') {
        step.status = ExecutionStatus.FAILED;
        step.error = event.error;

        yield createStepEvent({
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
        this.logger.info({ message: event.message }, 'ReAct agent summarized');
        const parsedObj = this.parseJson(event.message);

        const newMessage = Message.schema.parse(parsedObj);

        const attachments = newMessage.attachments.map((attachment) =>
          File.schema.parse({
            filepath: attachment,
          }),
        );

        yield createMessageEvent({
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
