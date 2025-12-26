export class FileReadResult {
  constructor(
    readonly filepath: string,
    readonly content: string,
  ) {}
}

export class FileWriteResult {
  constructor(
    readonly filepath: string,
    readonly bytesWritten: number,
  ) {}
}
