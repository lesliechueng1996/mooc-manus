import type { Sandbox } from '@/domain/external/sandbox';
import { tool, ToolCollection } from './base';

export class ShellToolCollection extends ToolCollection {
  constructor(private readonly sandbox: Sandbox) {
    super('shell_tools');
  }

  @tool({
    name: 'shell_exec',
    description:
      '在指定 Shell 会话中执行命令。可用于运行代码，安装依赖包或文件管理',
    parameters: {
      sessionId: {
        type: 'string',
        description: '目标 Shell 会话的唯一标识符',
      },
      execDir: {
        type: 'string',
        description: '执行命令的工作目录（必须使用绝对路径）',
      },
      command: {
        type: 'string',
        description: '要执行的 Shell 命令',
      },
    },
    required: ['sessionId', 'execDir', 'command'],
  })
  async shellExec(params: {
    sessionId: string;
    execDir: string;
    command: string;
  }) {
    return this.sandbox.execCommand(
      params.sessionId,
      params.execDir,
      params.command,
    );
  }

  @tool({
    name: 'shell_view',
    description: '查看指定 Shell 会话的内容。用于检查命令执行结果或监控输出。',
    parameters: {
      sessionId: {
        type: 'string',
        description: '目标 Shell 会话的唯一标识符',
      },
    },
    required: ['sessionId'],
  })
  async shellView(params: { sessionId: string }) {
    return this.sandbox.viewShell(params.sessionId);
  }

  @tool({
    name: 'shell_wait',
    description:
      '等待指定 Shell 会话中正在运行的进程返回。在运行耗时较长的命令后使用。',
    parameters: {
      sessionId: {
        type: 'string',
        description: '目标 Shell 会话的唯一标识符',
      },
      seconds: {
        type: 'integer',
        description: '可选参数，等待时长（秒）',
      },
    },
    required: ['sessionId'],
  })
  async shellWait(params: { sessionId: string; seconds?: number }) {
    return this.sandbox.waitForProcess(params.sessionId, params.seconds);
  }

  @tool({
    name: 'shell_write_to_process',
    description:
      '向指定 Shell 会话中正在运行的进程写入输入。用于响应交互式命令提示符。',
    parameters: {
      sessionId: {
        type: 'string',
        description: '目标 Shell 会话的唯一标识符',
      },
      inputText: {
        type: 'string',
        description: '要写入进程的输入内容',
      },
      pressEnter: {
        type: 'boolean',
        description: '输入后是否按下回车键',
      },
    },
    required: ['sessionId', 'inputText', 'pressEnter'],
  })
  async shellWriteToProcess(params: {
    sessionId: string;
    inputText: string;
    pressEnter: boolean;
  }) {
    return this.sandbox.writeToProcess(
      params.sessionId,
      params.inputText,
      params.pressEnter,
    );
  }

  @tool({
    name: 'shell_kill_process',
    description:
      '在指定 Shell 会话中终止正在运行的进程。用于停止长时间运行的进程或处理卡死的命令。',
    parameters: {
      sessionId: {
        type: 'string',
        description: '目标 Shell 会话的唯一标识符',
      },
    },
    required: ['sessionId'],
  })
  async shellKillProcess(params: { sessionId: string }) {
    return this.sandbox.killProcess(params.sessionId);
  }
}
