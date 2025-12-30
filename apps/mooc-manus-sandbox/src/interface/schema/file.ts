import { createSuccessResponseSchema } from '@repo/common';
import { z } from 'zod';

export const readFileRequestSchema = z.object({
  filepath: z.string().describe('Absolute path of the file to read'),
  startLine: z
    .int()
    .optional()
    .nullable()
    .default(null)
    .describe('Starting line to read, index starts from 0'),
  endLine: z
    .int()
    .optional()
    .nullable()
    .default(null)
    .describe('Ending line number, exclusive'),
  sudo: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to use sudo permission to read the file'),
  maxLength: z
    .int()
    .optional()
    .nullable()
    .default(10000)
    .describe('Maximum length of file content to read, default is 10000'),
});

export const readFileResponseSchema = createSuccessResponseSchema(
  z.object({
    filepath: z.string().describe('Absolute path of the file to read'),
    content: z.string().describe('Content of the file'),
  }),
);

export const writeFileRequestSchema = z.object({
  filepath: z.string().describe('Absolute path of the file to read'),
  content: z.string().describe('Content of the file'),
  append: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to append to the file'),
  leadingNewline: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to add leading newline at the beginning of content'),
  trailingNewline: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to add trailing newline at the end of content'),
  sudo: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to use sudo permission to write the file'),
});

export const writeFileResponseSchema = createSuccessResponseSchema(
  z.object({
    filepath: z.string().describe('Absolute path of the file to write'),
    bytesWritten: z
      .number()
      .nullable()
      .describe('Number of bytes written to the file'),
  }),
);

export const replaceInFileRequestSchema = z.object({
  filepath: z.string().describe('Absolute path of the file to replace content'),
  oldStr: z.string().describe('Original string to be replaced'),
  newStr: z.string().describe('New string to replace with'),
  sudo: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to use sudo permission to replace string'),
});

export const replaceInFileResponseSchema = createSuccessResponseSchema(
  z.object({
    filepath: z
      .string()
      .describe('Absolute path of the file to replace content'),
    replacedCount: z.number().describe('Number of replacements made'),
  }),
);

export const searchInFileRequestSchema = z.object({
  filepath: z.string().describe('Absolute path of the file to search content'),
  regex: z.string().describe('Regular expression pattern for matching'),
  sudo: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether to use sudo permission to search file content'),
});

export const searchInFileResponseSchema = createSuccessResponseSchema(
  z.object({
    filepath: z
      .string()
      .describe('Absolute path of the file to search content'),
    matches: z.array(z.string()).describe('Matches found in the file'),
    lineNumbers: z.array(z.number()).describe('Line numbers of matches'),
  }),
);

export const findFileRequestSchema = z.object({
  dirPath: z.string().describe('Absolute path of the directory to search'),
  globPattern: z
    .string()
    .describe('Filename pattern using glob syntax wildcards'),
});

export const findFileResponseSchema = createSuccessResponseSchema(
  z.object({
    dirPath: z.string().describe('Absolute path of the directory to search'),
    files: z.array(z.string()).describe('Files found in the directory'),
  }),
);

export const uploadFileRequestSchema = z.object({
  file: z.file().describe('File to upload'),
  filepath: z.string().describe('Absolute path of the file to upload'),
});

export const uploadFileResponseSchema = createSuccessResponseSchema(
  z.object({
    filepath: z.string().describe('Absolute path of the file to upload'),
    fileSize: z.number().describe('Size of the file in bytes'),
    success: z.boolean().describe('Whether the file upload is successful'),
  }),
);

export const downloadFileRequestSchema = z.object({
  filepath: z.string().describe('Absolute path of the file to download'),
});

export const downloadFileResponseSchema = z
  .unknown()
  .describe('Downloaded file (binary content)');

export const checkFileExistsRequestSchema = z.object({
  filepath: z.string().describe('Absolute path of the file to check'),
});

export const checkFileExistsResponseSchema = createSuccessResponseSchema(
  z.object({
    filepath: z.string().describe('Absolute path of the file to check'),
    exists: z.boolean().describe('Whether the file exists'),
  }),
);

export const deleteFileRequestSchema = z.object({
  filepath: z.string().describe('Absolute path of the file to delete'),
});

export const deleteFileResponseSchema = createSuccessResponseSchema(
  z.object({
    filepath: z.string().describe('Absolute path of the file to delete'),
    deleted: z.boolean().describe('Whether the file is deleted successfully'),
  }),
);
