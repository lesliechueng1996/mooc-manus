export type ParseJson = (
  json: string,
  defaultValue?: unknown,
) => Promise<
  Record<string, unknown> | Array<Record<string, unknown>> | unknown
>;
