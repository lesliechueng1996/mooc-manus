import { existsSync } from 'node:fs';
import os from 'node:os';
import { randomUUIDv7 } from 'bun';
import type { Logger } from '@/infrastructure/logging';
import {
  BadRequestException,
  InternalServerErrorException,
  NotFoundException,
} from '@/interface/error/exception';
import {
  ConsoleRecord,
  Shell,
  ShellExecResult,
  ShellViewResult,
  ShellWaitResult,
} from '@/models/shell';

const activeShells: Map<string, Shell> = new Map();

export class ShellService {
  constructor(private readonly logger: Logger) {}

  static createSessionId(options?: { logger: Logger }): string {
    const sessionId = randomUUIDv7();
    options?.logger.info('Created shell session', { sessionId });
    return sessionId;
  }

  private getDisplayPath(path: string) {
    const homeDir = os.homedir();
    this.logger.info('Home directory: {homeDir}', { homeDir });
    if (path.startsWith(homeDir)) {
      return `~${path.slice(homeDir.length)}`;
    }
    return path;
  }

  private formatPs1(execDir: string) {
    const username = os.userInfo().username;
    const hostname = os.hostname();
    const displayPath = this.getDisplayPath(execDir);

    return `${username}@${hostname}:${displayPath}`;
  }

  private createProcess(command: string, execDir: string) {
    this.logger.info('Creating process: {command} in {execDir}', {
      command,
      execDir,
    });

    let shellExec: string | undefined;
    const platform = os.platform();
    if (platform !== 'win32') {
      const shell = os.userInfo().shell;
      if (shell?.includes('/bin/bash')) {
        shellExec = '/bin/bash';
      } else if (shell?.includes('/bin/zsh')) {
        shellExec = '/bin/zsh';
      }
    } else {
      shellExec = Bun.which('powershell') ?? '';
      if (shellExec === '') {
        shellExec = Bun.which('cmd') ?? '';
      }
    }

    if (!shellExec) {
      shellExec = Bun.env.SHELL || '/bin/bash';
    }

    return Bun.spawn([shellExec, '-c', command], {
      cwd: execDir,
      lazy: true,
      stderr: 'pipe',
    });
  }

  private getShell(sessionId: string): Shell {
    if (!activeShells.has(sessionId)) {
      this.logger.error('Shell session not found: {sessionId}', { sessionId });
      throw new NotFoundException(`Shell session not found: ${sessionId}`);
    }
    const shell = activeShells.get(sessionId);
    if (!shell) {
      this.logger.error(
        'Shell session not found in activeShells: {sessionId}',
        { sessionId },
      );
      throw new NotFoundException(`Shell session not found: ${sessionId}`);
    }
    return shell;
  }

  private async readProcessOutput(sessionId: string) {
    const shell = this.getShell(sessionId);

    const proc = shell.process;
    const textPromise = new Response(proc.stdout).text();
    const errorPromise = new Response(proc.stderr).text();
    const [text, error] = await Promise.all([textPromise, errorPromise]);

    const finalOutput = text + error;
    const lastConsoleRecord =
      shell.consoleRecords[shell.consoleRecords.length - 1];

    shell.output = finalOutput;
    lastConsoleRecord.output = finalOutput;
  }

  private async waitForProcess(
    sessionId: string,
    seconds: number = 60,
  ): Promise<ShellWaitResult> {
    this.logger.info(
      'Waiting for process to finish: {sessionId} for {seconds} seconds',
      { sessionId, seconds },
    );
    const shell = this.getShell(sessionId);

    const proc = shell.process;

    const sleepPromise = Bun.sleep(seconds * 1000);
    const waitResult = await Promise.race([
      sleepPromise.then(() => {
        return { tag: 'timeout' as const };
      }),
      proc.exited.then(() => {
        return { tag: 'exited' as const, returnCode: proc.exitCode };
      }),
    ]);

    if (waitResult.tag === 'timeout') {
      return new ShellWaitResult(null);
    }

    return new ShellWaitResult(waitResult.returnCode);
  }

  private removeAsciiEscapeCodes(text: string) {
    const ESC = String.fromCharCode(27);

    // Match CSI sequences: ESC[ + parameters (digits, semicolons, question marks, etc.) + command character (letter)
    // Examples: ESC[31m (red), ESC[2J (clear screen), ESC[1;2H (cursor positioning)
    const csiPattern = `${ESC}\\[[0-9;?]*[a-zA-Z]`;

    // Match OSC sequences: ESC] + any characters until BEL or ST
    // Examples: ESC]0;titleBEL or ESC]0;titleESC\\
    const oscPattern = `${ESC}\\][\\s\\S]*?(?:${ESC}\\\\|\\u0007)`;

    // Match other single-character escape sequences: ESC + single character
    // Examples: ESC(, ESC), ESC#
    const singleCharPattern = `${ESC}[\\x40-\\x7E]`;

    // Combine all patterns
    const pattern = `(?:${csiPattern}|${oscPattern}|${singleCharPattern})`;
    return text.replace(new RegExp(pattern, 'g'), '');
  }

  getConsoleRecords(shell: Shell): ConsoleRecord[] {
    const cleanConsoleRecords: ConsoleRecord[] = [];
    for (const record of shell.consoleRecords) {
      cleanConsoleRecords.push(
        new ConsoleRecord(
          record.ps1,
          record.command,
          this.removeAsciiEscapeCodes(record.output),
        ),
      );
    }
    return cleanConsoleRecords;
  }

  viewShell(sessionId: string, console: boolean = false): ShellViewResult {
    const shell = this.getShell(sessionId);
    const cleanOutput = this.removeAsciiEscapeCodes(shell.output);

    let consoleRecords: ConsoleRecord[] = [];
    if (console) {
      consoleRecords = this.getConsoleRecords(shell);
    }

    return new ShellViewResult(sessionId, cleanOutput, consoleRecords);
  }

  async execCommand(
    sessionId: string,
    execDir: string,
    command: string,
  ): Promise<ShellExecResult> {
    this.logger.info(
      'Executing command: {command} in {execDir} with sessionId: {sessionId}',
      { command, execDir, sessionId },
    );
    if (!existsSync(execDir)) {
      this.logger.error('Execution directory does not exist: {execDir}', {
        execDir,
      });
      throw new BadRequestException(
        `Execution directory does not exist: ${execDir}`,
      );
    }

    try {
      const ps1 = this.formatPs1(execDir);

      if (!activeShells.has(sessionId)) {
        this.logger.info('Creating new shell session: {sessionId}', {
          sessionId,
        });
        const proc = this.createProcess(command, execDir);
        const newShell = new Shell(proc, execDir);
        newShell.addConsoleRecord(new ConsoleRecord(ps1, command, ''));
        activeShells.set(sessionId, newShell);
      } else {
        this.logger.info('Using existing shell session: {sessionId}', {
          sessionId,
        });
        const shell = activeShells.get(sessionId);
        if (!shell) {
          this.logger.error('Shell session not found: {sessionId}', {
            sessionId,
          });
          throw new BadRequestException(
            `Shell session not found: ${sessionId}`,
          );
        }

        const oldProcess = shell.process;
        if (oldProcess.exitCode === null) {
          this.logger.info('Killing old process: {sessionId}', { sessionId });
          oldProcess.kill();
        }

        const newProcess = this.createProcess(command, execDir);
        shell.process = newProcess;
        shell.execDir = execDir;
        shell.output = '';
        shell.addConsoleRecord(new ConsoleRecord(ps1, command, ''));
      }

      const waitResult = await this.waitForProcess(sessionId, 5);
      if (waitResult.returnCode !== null) {
        this.logger.info(
          'Process finished: {sessionId}, returnCode: {returnCode}',
          { sessionId, returnCode: waitResult.returnCode },
        );
        await this.readProcessOutput(sessionId);

        const viewResult = this.viewShell(sessionId);

        return ShellExecResult.make({
          sessionId,
          command,
          status: 'completed',
          returnCode: waitResult.returnCode,
          output: viewResult.output,
        });
      }

      return ShellExecResult.make({
        sessionId,
        command,
        status: 'running',
      });
    } catch (error) {
      this.logger.error(
        'Error executing command: {command} in {execDir} with sessionId: {sessionId}',
        { command, execDir, sessionId, error },
      );
      throw new InternalServerErrorException(
        `Error executing command: ${command} in ${execDir} with sessionId: ${sessionId}, error: ${JSON.stringify(error)}`,
      );
    }
  }
}
