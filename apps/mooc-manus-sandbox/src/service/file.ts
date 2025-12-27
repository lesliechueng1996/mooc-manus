import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BaseException,
  InternalServerErrorException,
  NotFoundException,
} from '@repo/common';
import { $ } from 'bun';
import type { Logger } from '@/infrastructure/logging';
import { FileReadResult, FileWriteResult } from '@/models/file';

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

    try {
      let content = '';
      if (sudo) {
        const command = `cat ${filepath}`;
        const proc = Bun.spawn(['sudo', 'bash', '-c', command], {
          stdout: 'pipe',
          stderr: 'pipe',
        });
        content = await new Response(proc.stdout).text();
        await proc.exited;
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
    } catch (error) {
      this.logger.error('Error reading file: {filepath}, error: {error}', {
        filepath,
        error,
      });
      throw new InternalServerErrorException(`Error reading file: ${filepath}`);
    }
  }

  async writeFile(
    filepath: string,
    content: string,
    append: boolean = false,
    leadingNewline: boolean = false,
    trailingNewline: boolean = false,
    sudo: boolean = false,
  ) {
    try {
      let finalContent = content;
      if (leadingNewline) {
        finalContent = `\n${finalContent}`;
      }
      if (trailingNewline) {
        finalContent = `${finalContent}\n`;
      }

      let bytesWritten = 0;
      if (sudo) {
        const mode = append ? '>>' : '>';
        const tempFilePath = path.join(
          os.tmpdir(),
          `file-write-${process.pid}.tmp`,
        );
        bytesWritten = await Bun.write(tempFilePath, finalContent);
        const command = `cat ${tempFilePath} ${mode} ${filepath}`;
        const proc = Bun.spawn(['sudo', 'bash', '-c', command], {
          stdout: 'pipe',
          stderr: 'pipe',
        });
        await proc.exited;

        await fs.promises.unlink(tempFilePath);
      } else {
        const isFileExists = fs.existsSync(filepath);
        if (!isFileExists) {
          const dir = path.dirname(filepath);
          await fs.promises.mkdir(dir, { recursive: true });
          bytesWritten = await Bun.write(filepath, finalContent);
        } else {
          if (append) {
            const handle = await fs.promises.open(filepath, 'a');
            try {
              const writeResult = await handle.write(finalContent);
              bytesWritten = writeResult.bytesWritten;
            } finally {
              await handle.close();
            }
          } else {
            bytesWritten = await Bun.write(filepath, finalContent);
          }
        }
      }

      return new FileWriteResult(filepath, bytesWritten);
    } catch (error) {
      this.logger.error('Error writing file: {filepath}, error: {error}', {
        filepath,
        error,
      });
      if (error instanceof BaseException) {
        throw error;
      }
      throw new InternalServerErrorException(`Error writing file: ${filepath}`);
    }
  }
}
