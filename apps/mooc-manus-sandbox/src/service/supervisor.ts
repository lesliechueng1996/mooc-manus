import { Schema } from 'effect';
import xmlrpc from 'xmlrpc';
import type { Logger } from '@/infrastructure/logging';
import { InternalServerErrorException } from '@/interface/error/exception';
import { ProcessInfo } from '@/models/supervisor';

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
}
