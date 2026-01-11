export type ToolResult<T> = {
  success: boolean;
  message: string | null;
  data: T | null;
};

export const toolResultFromSandbox = <T>(
  code: number,
  msg: string | null | undefined,
  data: T,
) => {
  return {
    success: code < 300,
    message: msg ?? null,
    data,
  } as ToolResult<T>;
};
