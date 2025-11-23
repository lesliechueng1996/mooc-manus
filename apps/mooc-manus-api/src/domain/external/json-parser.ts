export type ParseJson = (
  json: string,
  defaultValue?: unknown,
) => Record<string, unknown> | Array<Record<string, unknown>> | unknown;
