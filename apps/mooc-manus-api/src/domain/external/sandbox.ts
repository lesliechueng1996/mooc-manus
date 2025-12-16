import type { ToolResult } from '../models/tool-result';
import type { Browser } from './browser';

export interface Sandbox {
  execCommand(
    sessionId: string,
    execDir: string,
    command: string,
  ): Promise<ToolResult<string>>;

  viewShell(sessionId: string, console?: boolean): Promise<ToolResult<string>>;

  waitForProcess(
    sessionId: string,
    seconds?: number,
  ): Promise<ToolResult<void>>;

  writeToProcess(
    sessionId: string,
    inputText: string,
    pressEnter?: boolean,
  ): Promise<ToolResult<void>>;

  killProcess(sessionId: string): Promise<ToolResult<void>>;

  fileWrite(
    filePath: string,
    content: string,
    options?: {
      append?: boolean;
      leadingNewline?: boolean;
      trailingNewline?: boolean;
      sudo?: boolean;
    },
  ): Promise<ToolResult<void>>;

  fileRead(
    filePath: string,
    options?: { startLine?: number; endLine?: number; sudo?: boolean },
  ): Promise<ToolResult<string>>;

  fileExists(filePath: string): Promise<ToolResult<boolean>>;

  fileDelete(filePath: string): Promise<ToolResult<void>>;

  fileList(dirPath: string): Promise<ToolResult<string[]>>;

  fileReplace(
    filePath: string,
    oldText: string,
    newText: string,
    options?: { sudo?: boolean },
  ): Promise<ToolResult<void>>;

  fileSearch(
    filePath: string,
    regex: string,
    options?: { sudo?: boolean },
  ): Promise<ToolResult<string[]>>;

  fileFind(dirPath: string, globPattern: string): Promise<ToolResult<string[]>>;

  fileUpload(
    fileData: Buffer,
    filePath: string,
    fileName?: string,
  ): Promise<ToolResult<void>>;

  fileDownload(filePath: string): Promise<Buffer>;

  ensureSandbox(): Promise<void>;

  destroy(): Promise<boolean>;

  getBrowser(): Browser;

  id: {
    get: () => string;
  };

  cdpUrl: {
    get: () => string;
  };

  vncUrl: {
    get: () => string;
  };
}

export namespace Sandbox {
  export declare function create(id: string): Sandbox;
  export declare function get(id: string): Sandbox;
}
