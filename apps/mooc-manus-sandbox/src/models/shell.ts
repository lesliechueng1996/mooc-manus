import type { Subprocess } from 'bun';
import { Schema } from 'effect';

export class ShellExecResult extends Schema.Class<ShellExecResult>(
  'ShellExecResult',
)({
  sessionId: Schema.String,
  command: Schema.String,
  status: Schema.String,
  returnCode: Schema.optional(Schema.Number),
  output: Schema.optional(Schema.String),
}) {}

export class ConsoleRecord {
  constructor(
    readonly ps1: string,
    readonly command: string,
    public output: string,
  ) {}
}

export class Shell {
  process: Bun.Subprocess<'ignore', 'pipe', 'pipe'>;
  execDir: string;
  output: string;
  consoleRecords: ConsoleRecord[] = [];

  constructor(process: Subprocess<'ignore', 'pipe', 'pipe'>, execDir: string) {
    this.process = process;
    this.execDir = execDir;
    this.output = '';
    this.consoleRecords = [];
  }

  addConsoleRecord(record: ConsoleRecord) {
    this.consoleRecords.push(record);
  }
}

export class ShellWaitResult {
  constructor(
    readonly returnCode: number | null,
    readonly sessionId: string,
  ) {}
}

export class ShellViewResult {
  constructor(
    readonly sessionId: string,
    readonly output: string,
    readonly consoleRecords: ConsoleRecord[] = [],
  ) {}
}
