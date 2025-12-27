import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {
  BadRequestException,
  BaseException,
  InternalServerErrorException,
  NotFoundException,
} from '@repo/common';
import { Glob } from 'bun';
import type { Logger } from '@/infrastructure/logging';
import {
  FileFindResult,
  FileReadResult,
  FileReplaceResult,
  FileSearchResult,
  FileUploadResult,
  FileWriteResult,
} from '@/models/file';

export class FileService {
  constructor(private readonly logger: Logger) {}

  ensureFile(filepath: string) {
    if (!fs.existsSync(filepath)) {
      throw new NotFoundException(`File does not exist: ${filepath}`);
    }
  }

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

  async replaceInFile(
    filepath: string,
    oldStr: string,
    newStr: string,
    sudo: boolean = false,
  ) {
    const fileReadResult = await this.readFile(
      filepath,
      null,
      null,
      sudo,
      null,
    );
    const content = fileReadResult.content;
    const replacedCount = content.split(oldStr).length - 1;
    if (replacedCount === 0) {
      return new FileReplaceResult(filepath, 0);
    }
    const newContent = content.replaceAll(oldStr, newStr);
    await this.writeFile(filepath, newContent, false, false, false, sudo);
    return new FileReplaceResult(filepath, replacedCount);
  }

  async searchInFile(filepath: string, regex: string, sudo: boolean = false) {
    const fileReadResult = await this.readFile(
      filepath,
      null,
      null,
      sudo,
      null,
    );
    const content = fileReadResult.content;
    const lines = content.split('\n');

    let pattern: RegExp;
    try {
      pattern = new RegExp(regex);
    } catch (error) {
      throw new BadRequestException(
        `Invalid regular expression: ${regex}, error: ${JSON.stringify(error)}`,
      );
    }

    const matches: string[] = [];
    const lineNumbers: number[] = [];

    const BATCH_SIZE = 1000;
    for (let i = 0; i < lines.length; i += BATCH_SIZE) {
      const batch = lines.slice(i, i + BATCH_SIZE);
      for (let j = 0; j < batch.length; j++) {
        const line = batch[j];
        const match = line.match(pattern);
        if (match) {
          matches.push(line);
          lineNumbers.push(i + j);
        }
      }
      if (i + BATCH_SIZE < lines.length) {
        await new Promise((resolve) => setImmediate(resolve));
      }
    }
    return new FileSearchResult(filepath, matches, lineNumbers);
  }

  async findFiles(dirPath: string, globPattern: string) {
    if (!fs.existsSync(dirPath)) {
      throw new NotFoundException(`Directory does not exist: ${dirPath}`);
    }

    const glob = new Glob(globPattern);
    const files: string[] = [];
    for await (const filePath of glob.scan(dirPath)) {
      files.push(path.join(dirPath, filePath));
    }
    return new FileFindResult(dirPath, files);
  }

  async uploadFile(file: File, filepath: string) {
    const dirPath = path.dirname(filepath);
    if (!fs.existsSync(dirPath)) {
      await fs.promises.mkdir(dirPath, { recursive: true });
    }

    try {
      const bytesWritten = await Bun.write(filepath, file);
      return new FileUploadResult(filepath, bytesWritten, true);
    } catch (error) {
      this.logger.error('Error uploading file: {filepath}, error: {error}', {
        filepath,
        error,
      });
      throw new InternalServerErrorException(
        `Error uploading file: ${filepath}`,
      );
    }
  }
}
