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
  stdout_logfile: Schema.String,
  stderr_logfile: Schema.String,
  pid: Schema.String,
}) {
  format() {
    return {
      name: this.name,
      group: this.group,
      description: this.description,
      start: this.start,
      stop: this.stop,
      now: this.now,
      state: this.state,
      statename: this.statename,
      spawnerr: this.spawnerr,
      exitstatus: this.exitstatus,
      logfile: this.logfile,
      stdoutLogfile: this.stdout_logfile,
      stderrLogfile: this.stderr_logfile,
      pid: this.pid,
    };
  }
}
