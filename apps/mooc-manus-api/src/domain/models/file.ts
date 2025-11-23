import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';

export const fileSchema = z.object({
  id: z.string().default(uuidv4),
  filename: z.string().default(''),
  filepath: z.string().default(''),
  key: z.string().default(''),
  extension: z.string().default(''),
  mimeType: z.string().default(''),
  size: z.int().default(0),
});

type FileProps = z.infer<typeof fileSchema>;

export class File {
  constructor(private readonly props: FileProps) {}

  get id() {
    return this.props.id;
  }

  static schema = fileSchema.transform((data) => new File(data));
}
