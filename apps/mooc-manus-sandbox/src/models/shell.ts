import type { Subprocess } from 'bun';
import { Schema } from 'effect';

export enum ShellStatus {
  RUNNING = 'running',
  COMPLETED = 'completed',
}

export class ShellExecResult extends Schema.Class<ShellExecResult>(
  'ShellExecResult',
)({
  sessionId: Schema.String,
  command: Schema.String,
  status: Schema.Enums(ShellStatus),
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

export type Process = Subprocess<'pipe', 'pipe', 'pipe'>;

export class Shell {
  process: Process;
  execDir: string;
  output: string;
  consoleRecords: ConsoleRecord[] = [];

  constructor(process: Process, execDir: string) {
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

export enum ShellWriteStatus {
  SUCCESS = 'success',
}

export class ShellWriteResult {
  constructor(
    readonly sessionId: string,
    readonly status: string,
  ) {}
}

export enum ShellKillStatus {
  TERMINATED = 'terminated',
  ALREADY_TERMINATED = 'already_terminated',
}

export class ShellKillResult {
  constructor(
    readonly sessionId: string,
    readonly status: string,
    readonly returnCode: number,
  ) {}
}
