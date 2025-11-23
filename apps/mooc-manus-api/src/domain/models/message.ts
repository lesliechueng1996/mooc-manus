import { z } from 'zod';

export const messageSchema = z.object({
  message: z.string().default(''),
  attachments: z.array(z.string()).default([]),
});

type MessageProps = z.infer<typeof messageSchema>;

export class Message {
  constructor(private readonly props: MessageProps) {}

  get message() {
    return this.props.message;
  }

  get attachments() {
    return this.props.attachments;
  }

  toJSON() {
    return this.props;
  }

  static schema = messageSchema.transform((data) => new Message(data));
}
