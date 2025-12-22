export type ToolResult<T> = {
  success: boolean;
  message: string | null;
  data: T | null;
};
