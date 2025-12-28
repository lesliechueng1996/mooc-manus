import { Schema } from 'effect';
import xmlrpc from 'xmlrpc';
import type { Logger } from '@/infrastructure/logging';
import { InternalServerErrorException } from '@/interface/error/exception';
import {
  ProcessInfo,
  SupervisorActionResult,
  SupervisorActionResultStatus,
} from '@/models/supervisor';

export class SupervisorService {
  private readonly client: xmlrpc.Client;

  constructor(private readonly logger: Logger) {
    this.client = xmlrpc.createClient({
      host: process.env.SUPERVISOR_HOST || '127.0.0.1',
      port: parseInt(process.env.SUPERVISOR_PORT || '9001', 10),
      path: '/RPC2',
    });
  }

  private async callRpc(method: string, params: unknown[]) {
    const { resolve, reject, promise } = Promise.withResolvers();

    try {
      this.client.methodCall(method, params, (error, value) => {
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
}
