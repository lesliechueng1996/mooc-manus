import { Schema } from 'effect';

export class ProcessInfo extends Schema.Class<ProcessInfo>('ProcessInfo')({
  name: Schema.String,
  group: Schema.String,
  description: Schema.String,
  start: Schema.Number,
  stop: Schema.Number,
  now: Schema.Number,
  state: Schema.Number,
  statename: Schema.String,
  spawnerr: Schema.String,
  exitstatus: Schema.Number,
  logfile: Schema.String,
  stdoutLogfile: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey('stdout_logfile'),
  ),
  stderrLogfile: Schema.propertySignature(Schema.String).pipe(
    Schema.fromKey('stderr_logfile'),
  ),
  pid: Schema.Number,
}) {}

export enum SupervisorActionResultStatus {
  STOPPED = 'stopped',
  SHUTDOWN = 'shutdown',
  RESTARTED = 'restarted',
}

export class SupervisorActionResult extends Schema.Class<SupervisorActionResult>(
  'SupervisorActionResult',
)({
  status: Schema.Enums(SupervisorActionResultStatus),
  result: Schema.optionalWith(Schema.Any, {
    default: () => null,
    nullable: true,
  }),
  stopResult: Schema.optionalWith(Schema.Any, {
    default: () => null,
    nullable: true,
  }),
  startResult: Schema.optionalWith(Schema.Any, {
    default: () => null,
    nullable: true,
  }),
  shutdownResult: Schema.optionalWith(Schema.Any, {
    default: () => null,
    nullable: true,
  }),
}) {}
