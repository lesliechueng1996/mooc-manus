import { dns, randomUUIDv7 } from 'bun';
import Docker, { type Container, type ContainerCreateOptions } from 'dockerode';
import { z } from 'zod';
import type { Browser } from '@/domain/external/browser';
import type { Sandbox } from '@/domain/external/sandbox';
import {
  type ToolResult,
  toolResultFromSandbox,
} from '@/domain/model/tool-result';
import type { Logger } from '@/infrastructure/logging';
import { PlaywrightBrowser } from '../browser/playwright-browser';
import { createSandboxAppClient } from '../sandbox-app/eden-sandbox-client';

const ipSchema = z.ipv4();

const createDockerClient = () => new Docker();

const resolveHostnameToIp = async (
  hostname: string,
  logger: Logger,
): Promise<string | null> => {
  try {
    const result = ipSchema.safeParse(hostname);
    if (result.success) {
      return result.data;
    }

    const dnsResult = await dns.lookup(hostname, { family: 4 });
    if (dnsResult && dnsResult.length > 0) {
      return dnsResult[0].address;
    }

    return null;
  } catch (err) {
    logger.error('Error resolving hostname: {hostname} to IP', {
      hostname,
      error: err,
    });
    return null;
  }
};

export class DockerSandbox implements Sandbox {
  private readonly baseUrl: string;
  readonly vncUrl: string;
  readonly cdpUrl: string;
  private readonly sandboxAppClient: ReturnType<typeof createSandboxAppClient>;

  constructor(
    private readonly logger: Logger,
    readonly ip: string | null = null,
    private readonly containerName: string | null = null,
  ) {
    this.baseUrl = `http://${ip}:8081`;
    this.vncUrl = `http://${ip}:5901`;
    this.cdpUrl = `http://${ip}:9222`;
    this.sandboxAppClient = createSandboxAppClient(this.baseUrl);
  }

  get id(): string {
    return this.containerName ?? 'mooc-manus-sandbox';
  }

  static async getContainerIp(container: Container) {
    const inspect = await container.inspect();
    const ipAddress = inspect.NetworkSettings.IPAddress;

    if (!ipAddress && inspect.NetworkSettings.Networks) {
      const networks = inspect.NetworkSettings.Networks;

      for (const network of Object.values(networks)) {
        if (network.IPAddress) {
          return network.IPAddress;
        }
      }
    }

    return ipAddress;
  }

  static async createTask(logger: Logger) {
    const image = process.env.SANDBOX_IMAGE;
    const namePrefix = process.env.SANDBOX_NAME_PREFIX;
    const containerName = `${namePrefix}-${randomUUIDv7().substring(0, 8)}`;
    try {
      const env = {
        SERVICE_TIMEOUT_MINUTES: process.env.SANDBOX_TTL_MINUTES,
        CHROME_ARGS: process.env.SANDBOX_CHROME_ARGS,
        HTTPS_PROXY: process.env.SANDBOX_HTTPS_PROXY,
        HTTP_PROXY: process.env.SANDBOX_HTTP_PROXY,
        NO_PROXY: process.env.SANDBOX_NO_PROXY,
      };
      const docker = createDockerClient();
      const config: ContainerCreateOptions = {
        Image: image,
        name: containerName,
        Env: Object.entries(env).map(([key, value]) => `${key}=${value}`),
        HostConfig: {
          AutoRemove: true,
        },
      };
      const sandboxNetwork = process.env.SANDBOX_NETWORK;
      if (sandboxNetwork) {
        config.HostConfig = {
          ...config.HostConfig,
          NetworkMode: sandboxNetwork,
        };
      }
      const container = await docker.createContainer(config);
      await container.start();

      const ip = await DockerSandbox.getContainerIp(container);

      return new DockerSandbox(logger, ip, containerName);
    } catch (err) {
      logger.error('Error creating sandbox task: {error}', { error: err });
      throw err;
    }
  }

  static async create(logger: Logger) {
    const sandboxAddress = process.env.SANDBOX_ADDRESS;
    if (sandboxAddress) {
      const ip = await resolveHostnameToIp(sandboxAddress, logger);
      return new DockerSandbox(logger, ip);
    }
    return await DockerSandbox.createTask(logger);
  }

  async destroy() {
    try {
      if (this.containerName) {
        const docker = createDockerClient();
        const container = docker.getContainer(this.containerName);
        await container.remove({
          force: true,
        });
      }
      return true;
    } catch (err) {
      this.logger.error('Error destroying sandbox: {id}', {
        id: this.containerName,
        error: err,
      });
      return false;
    }
  }

  static async get(id: string, logger: Logger) {
    const sandboxAddress = process.env.SANDBOX_ADDRESS;
    if (sandboxAddress) {
      const ip = await resolveHostnameToIp(sandboxAddress, logger);
      return new DockerSandbox(logger, ip, id);
    }

    const docker = createDockerClient();
    const container = docker.getContainer(id);
    const ip = await DockerSandbox.getContainerIp(container);
    return new DockerSandbox(logger, ip, id);
  }

  getBrowser(): Browser {
    return new PlaywrightBrowser(this.cdpUrl, null, this.logger);
  }

  async ensureSandbox(): Promise<void> {
    const maxRetries = 30;
    const retryInterval = 2;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const response = await this.sandboxAppClient.api.supervisor.status.get({
          headers: this.logger.toHeaders(),
        });
        if (response.status >= 300) {
          throw new Error(
            `Sandbox Supervisor process status is ${response.status}`,
          );
        }

        if (!response.data) {
          throw new Error(
            'No response data from Sandbox Supervisor process status',
          );
        }

        const toolResult = toolResultFromSandbox(
          response.data.code,
          response.data.msg,
          response.data.data,
        );
        if (!toolResult.success) {
          throw new Error(
            `Supervisor process status monitor failed, ${toolResult.message}`,
          );
        }
        const services = toolResult.data || [];
        if (services.length === 0) {
          throw new Error('No services found from Supervisor');
        }

        let allRunning = true;
        const nonRunningServices: string[] = [];
        for (const service of services) {
          const serviceName = service.name;
          const stateName = service.statename;

          if (stateName !== 'running') {
            allRunning = false;
            nonRunningServices.push(`${serviceName}(${stateName})`);
          }
        }

        if (!allRunning) {
          this.logger.info(
            'Waiting Sandbox Supervisor services running, pending services: {nonRunningServices}',
            { nonRunningServices },
          );
          throw new Error('Waiting Sandbox Supervisor services running');
        }

        this.logger.info(
          'All services in Sandbox Supervisor are running successfully',
        );
        return;
      } catch (err) {
        this.logger.warn(
          'Cannot ensure Sandbox Supervisor process status, retrying... {retries}, {error}',
          { retries: i, error: err },
        );
        await Bun.sleep(retryInterval * 1000);
      }
    }

    this.logger.error(
      'Cannot ensure Sandbox Supervisor process status, giving up after {maxRetries} retries',
      { maxRetries },
    );
    throw new Error('Cannot ensure Sandbox Supervisor process status');
  }

  async fileRead(
    filepath: string,
    options?: {
      startLine?: number;
      endLine?: number;
      sudo?: boolean;
      maxLength?: number;
    },
  ): Promise<ToolResult<{ filepath: string; content: string } | null>> {
    const response = await this.sandboxAppClient.api.file['read-file'].post(
      {
        filepath,
        startLine: options?.startLine ?? null,
        endLine: options?.endLine ?? null,
        sudo: options?.sudo ?? false,
        maxLength: options?.maxLength ?? null,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Read file failed',
      null,
    );
  }

  async fileWrite(
    filepath: string,
    content: string,
    options?: {
      append?: boolean;
      leadingNewline?: boolean;
      trailingNewline?: boolean;
      sudo?: boolean;
    },
  ): Promise<
    ToolResult<{ filepath: string; bytesWritten: number | null } | null>
  > {
    const response = await this.sandboxAppClient.api.file['write-file'].post(
      {
        filepath,
        content,
        append: options?.append ?? false,
        leadingNewline: options?.leadingNewline ?? false,
        trailingNewline: options?.trailingNewline ?? false,
        sudo: options?.sudo ?? false,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Write file failed',
      null,
    );
  }

  async fileReplace(
    filepath: string,
    oldText: string,
    newText: string,
    options?: { sudo?: boolean },
  ): Promise<ToolResult<{ filepath: string; replacedCount: number } | null>> {
    const response = await this.sandboxAppClient.api.file[
      'replace-in-file'
    ].post(
      {
        filepath,
        oldStr: oldText,
        newStr: newText,
        sudo: options?.sudo ?? false,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Replace in file failed',
      null,
    );
  }

  async fileSearch(
    filepath: string,
    regex: string,
    options?: { sudo?: boolean },
  ): Promise<
    ToolResult<{
      filepath: string;
      matches: string[];
      lineNumbers: number[];
    } | null>
  > {
    const response = await this.sandboxAppClient.api.file[
      'search-in-file'
    ].post(
      {
        filepath,
        regex,
        sudo: options?.sudo ?? false,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Search in file failed',
      null,
    );
  }

  async fileFind(
    dirPath: string,
    globPattern: string,
  ): Promise<
    ToolResult<{
      dirPath: string;
      files: string[];
    } | null>
  > {
    const response = await this.sandboxAppClient.api.file['find-files'].post(
      {
        dirPath,
        globPattern,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Find files failed',
      null,
    );
  }

  async fileList(
    dirPath: string,
  ): Promise<ToolResult<{ dirPath: string; files: string[] } | null>> {
    return this.fileFind(dirPath, '*');
  }

  async fileExists(filepath: string): Promise<
    ToolResult<{
      filepath: string;
      exists: boolean;
    } | null>
  > {
    const response = await this.sandboxAppClient.api.file[
      'check-file-exists'
    ].post(
      {
        filepath,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Check file exists failed',
      null,
    );
  }

  async fileDelete(filepath: string): Promise<
    ToolResult<{
      filepath: string;
      deleted: boolean;
    } | null>
  > {
    const response = await this.sandboxAppClient.api.file['delete-file'].post(
      {
        filepath,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Delete file failed',
      null,
    );
  }

  async fileUpload(
    fileData: File,
    filepath: string,
  ): Promise<
    ToolResult<{
      filepath: string;
      fileSize: number;
      success: boolean;
    } | null>
  > {
    const response = await this.sandboxAppClient.api.file['upload-file'].post(
      {
        filepath,
        file: fileData,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Delete file failed',
      null,
    );
  }

  async fileDownload(filepath: string): Promise<Buffer> {
    const response = await this.sandboxAppClient.api.file['download-file'].post(
      {
        filepath,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200) {
      return response.data as Buffer;
    }
    throw new Error('Download file failed');
  }

  async execCommand(
    sessionId: string,
    execDir: string,
    command: string,
  ): Promise<
    ToolResult<{
      sessionId: string;
      command: string;
      status: string;
      returnCode?: number | undefined;
      output?: string | undefined;
    } | null>
  > {
    const response = await this.sandboxAppClient.api.shell['exec-command'].post(
      {
        sessionId,
        execDir,
        command,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Execute command failed',
      null,
    );
  }

  async viewShell(
    sessionId: string,
    console?: boolean,
  ): Promise<
    ToolResult<{
      sessionId: string;
      output: string;
      consoleRecords: {
        ps1: string;
        command: string;
        output: string;
      }[];
    } | null>
  > {
    const response = await this.sandboxAppClient.api.shell['view-shell'].post(
      {
        sessionId,
        console: console ?? false,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'View shell failed',
      null,
    );
  }

  async writeToProcess(
    sessionId: string,
    inputText: string,
    pressEnter?: boolean,
  ): Promise<
    ToolResult<{
      sessionId: string;
      status: string;
    } | null>
  > {
    const response = await this.sandboxAppClient.api.shell[
      'write-to-process'
    ].post(
      {
        sessionId,
        inputText,
        pressEnter: pressEnter ?? false,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Write to process failed',
      null,
    );
  }

  async waitForProcess(
    sessionId: string,
    seconds?: number,
  ): Promise<
    ToolResult<{
      sessionId: string;
      returnCode: number | null;
    } | null>
  > {
    const response = await this.sandboxAppClient.api.shell[
      'wait-for-process'
    ].post(
      {
        sessionId,
        seconds: seconds ?? 60,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Wait for process failed',
      null,
    );
  }

  async killProcess(sessionId: string): Promise<
    ToolResult<{
      sessionId: string;
      status: string;
      returnCode: number | null;
    } | null>
  > {
    const response = await this.sandboxAppClient.api.shell['kill-process'].post(
      {
        sessionId,
      },
      {
        headers: this.logger.toHeaders(),
      },
    );
    if (response.status === 200 && response.data) {
      return toolResultFromSandbox(
        response.data.code,
        response.data.msg,
        response.data.data,
      );
    }
    return toolResultFromSandbox(
      response.data?.code ?? 500,
      response.data?.msg ?? 'Kill process failed',
      null,
    );
  }
}
