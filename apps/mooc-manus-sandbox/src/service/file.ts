import type { Logger } from '@/infrastructure/logging';
import { NotFoundException } from '@repo/common';
import fs from 'node:fs';
import os from 'node:os';
import { $ } from 'bun';
import { FileReadResult } from '@/models/file';

export class FileService {
  constructor(private readonly logger: Logger) {}

  async readFile(
    filepath: string,
    startLine: number | null = null,
    endLine: number | null = null,
    sudo: boolean = false,
    maxLength: number | null = 10000,
  ) {
    const isFileExists = fs.existsSync(filepath);
    if (!isFileExists && !sudo) {
      this.logger.error(
        'The file does not exist or you do not have permission to read it: {filepath}',
        { filepath },
      );
      throw new NotFoundException(
        `The file does not exist or you do not have permission to read it: ${filepath}`,
      );
    }

    const platform = os.platform();
    let content = '';
    if (sudo && platform !== 'win32') {
      const command = `sudo cat ${filepath}`;
      content = await $`${command}`.text();
    } else {
      const file = Bun.file(filepath);
      content = await file.text();
    }

    if (startLine !== null || endLine !== null) {
      const lines = content.split('\n');
      const start = startLine !== null ? startLine : 0;
      const end = endLine !== null ? endLine : lines.length;
      content = lines.slice(start, end).join('\n');
    }

    if (maxLength !== null && maxLength > 0 && content.length > maxLength) {
      content = `${content.substring(0, maxLength)}(truncated)`;
    }

    return new FileReadResult(filepath, content);
  }
}
