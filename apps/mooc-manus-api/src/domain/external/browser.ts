import type { ToolResult } from '../models/tool-result';

type Position = {
  x: number;
  y: number;
};

export interface Browser {
  viewPage(): Promise<ToolResult<string>>;

  navigate(url: string): Promise<ToolResult<void>>;

  restart(url: string): Promise<ToolResult<void>>;

  click(index: number): Promise<ToolResult<void>>;

  click(position: Position): Promise<ToolResult<void>>;

  input(
    text: string,
    pressEnter: boolean,
    index: number,
  ): Promise<ToolResult<void>>;

  input(
    text: string,
    pressEnter: boolean,
    position: Position,
  ): Promise<ToolResult<void>>;

  moveMouse(position: Position): Promise<ToolResult<void>>;

  pressKey(key: string): Promise<ToolResult<void>>;

  selectOption(index: number, option: number): Promise<ToolResult<void>>;

  scrollUp(toTop?: boolean): Promise<ToolResult<void>>;

  scrollDown(toBottom?: boolean): Promise<ToolResult<void>>;

  screenshot(fullPage?: boolean): Promise<ToolResult<string>>;

  consoleExec(javascript: string): Promise<ToolResult<void>>;

  consoleView(maxLines?: number): Promise<ToolResult<string>>;
}
