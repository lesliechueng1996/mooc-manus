import { format } from 'date-fns';
import { Schema } from 'effect';
import xmlrpc from 'xmlrpc';
import { Logger } from '@/infrastructure/logging';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@/interface/error/exception';
import {
  ProcessInfo,
  SupervisorActionResult,
  SupervisorActionResultStatus,
  SupervisorTimeoutResult,
} from '@/models/supervisor';

let timeoutActive = !!process.env.SERVER_TIMEOUT_MINUTES;
let shutdownTimer: NodeJS.Timeout | null = null;
let shutdownTime: number | null = null;
let expandEnabled = true;

export const isExpandEnabled = () => expandEnabled;
export const isTimeoutActive = () => timeoutActive;

const setupShutdownTimer = (minutes: number) => {
  if (shutdownTimer) {
    clearTimeout(shutdownTimer);
  }

  shutdownTime = Date.now() + minutes * 60 * 1000;
  shutdownTimer = setTimeout(
    async () => {
      const logger = new Logger();
      const supervisorService = new SupervisorService(logger);
      logger.info('Shutting down supervisor');
      await supervisorService.shutdown();
    },
    minutes * 60 * 1000,
  );
};

if (timeoutActive) {
  setupShutdownTimer(parseInt(process.env.SERVER_TIMEOUT_MINUTES || '0', 10));
}

export const enableExpand = () => {
  expandEnabled = true;
};

export const disableExpand = () => {
  expandEnabled = false;
};

const supervisorClient = xmlrpc.createClient({
  host: process.env.SUPERVISOR_HOST || '127.0.0.1',
  port: parseInt(process.env.SUPERVISOR_PORT || '9001', 10),
  path: '/RPC2',
});

export class SupervisorService {
  constructor(private readonly logger: Logger) {}

  private async callRpc(method: string, params: unknown[]) {
    const { resolve, reject, promise } = Promise.withResolvers();

    try {
      supervisorClient.methodCall(method, params, (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(value);
        }
      });
    } catch (error) {
      reject(error);
    }

    return promise;
  }

  async getAllProcessInfo(): Promise<ProcessInfo[]> {
    try {
      const result = (await this.callRpc(
        'supervisor.getAllProcessInfo',
        [],
      )) as Array<unknown>;
      return result.map((item) => Schema.decodeUnknownSync(ProcessInfo)(item));
    } catch (error) {
      this.logger.error('Error getting all process info.', { error });
      throw new InternalServerErrorException('Error getting all process info.');
    }
  }

  async stopAllProcesses(): Promise<SupervisorActionResult> {
    try {
      const result = (await this.callRpc(
        'supervisor.stopAllProcesses',
        [],
      )) as unknown;
      return SupervisorActionResult.make({
        status: SupervisorActionResultStatus.STOPPED,
        result,
      });
    } catch (error) {
      this.logger.error('Supervisor stop all processes failed.', { error });
      throw new InternalServerErrorException(
        'Supervisor stop all processes failed.',
      );
    }
  }

  async shutdown(): Promise<SupervisorActionResult> {
    try {
      const result = (await this.callRpc('supervisor.shutdown', [])) as unknown;
      return SupervisorActionResult.make({
        status: SupervisorActionResultStatus.SHUTDOWN,
        shutdownResult: result,
      });
    } catch (error) {
      this.logger.error('Supervisor shutdown failed.', { error });
      throw new InternalServerErrorException('Supervisor shutdown failed.');
    }
  }

  async restart() {
    try {
      const stopResult = (await this.callRpc(
        'supervisor.stopAllProcesses',
        [],
      )) as unknown;
      const startResult = (await this.callRpc(
        'supervisor.startAllProcesses',
        [],
      )) as unknown;
      return SupervisorActionResult.make({
        status: SupervisorActionResultStatus.RESTARTED,
        stopResult,
        startResult,
      });
    } catch (error) {
      this.logger.error('Supervisor restart failed.', { error });
      throw new InternalServerErrorException('Supervisor restart failed.');
    }
  }

  private createTimeoutResult(
    status: string | null,
    active: boolean,
    timeoutMinutes: number | null,
  ) {
    return SupervisorTimeoutResult.make({
      status,
      active,
      shutdownTime: shutdownTime
        ? format(new Date(shutdownTime), 'yyyy-MM-dd HH:mm:ss.SSS')
        : null,
      timeoutMinutes,
      remainingSeconds: shutdownTime
        ? Math.floor((shutdownTime - Date.now()) / 1000)
        : null,
    });
  }

  async activateTimeout(minutes: number | null) {
    if (minutes === null && !process.env.SERVER_TIMEOUT_MINUTES) {
      throw new BadRequestException(
        'Do not have timeout minutes and no default timeout minutes in environment variables.',
      );
    }

    const timeoutMinutes =
      minutes ?? parseInt(process.env.SERVER_TIMEOUT_MINUTES || '0', 10);
    timeoutActive = true;
    setupShutdownTimer(timeoutMinutes);

    return this.createTimeoutResult('timeout_activated', true, timeoutMinutes);
  }

  async extendTimeout(minutes: number | null = 3) {
    const extendedMinutes = minutes ?? 3;
    if (shutdownTime === null) {
      this.logger.error('Timeout is not activated, the shutdownTime is null.');
      throw new BadRequestException('Timeout is not activated.');
    }

    const remaining = shutdownTime - Date.now();
    const timeoutMinutes =
      Math.floor(Math.max(remaining, 0) / 1000 / 60) + extendedMinutes;

    timeoutActive = true;
    setupShutdownTimer(timeoutMinutes);

    return this.createTimeoutResult('timeout_extended', true, timeoutMinutes);
  }

  async cancelTimeout() {
    if (!timeoutActive) {
      return SupervisorTimeoutResult.make({
        status: 'no_timeout_active',
        active: false,
      });
    }

    if (shutdownTimer) {
      clearTimeout(shutdownTimer);
      shutdownTimer = null;
    }

    timeoutActive = false;
    shutdownTime = null;
    enableExpand();

    return SupervisorTimeoutResult.make({
      status: 'timeout_cancelled',
      active: false,
    });
  }

  async getTimeoutStatus() {
    if (!timeoutActive) {
      return SupervisorTimeoutResult.make({
        active: false,
      });
    }

    const timeoutMinutes = shutdownTime
      ? Math.floor((shutdownTime - Date.now()) / 1000 / 60)
      : null;
    return this.createTimeoutResult('timeout_active', true, timeoutMinutes);
  }
}
