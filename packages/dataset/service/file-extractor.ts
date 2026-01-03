import fs from 'node:fs/promises';
import path from 'node:path';
import { getLogger, withTempFile } from '@repo/common';
import {
  CSVLoader,
  type DocumentLoader,
  DocxLoader,
  JSONLoader,
  PDFLoader,
  PPTXLoader,
  TextLoader,
} from '@repo/internal-langchain/community';
import { downloadFile } from '@repo/tencent-cos';

export const loadFromFile = async (
  filePath: string,
  returnText = false,
  isUnstructured = true,
) => {
  const fileExtension = path.extname(filePath).toLowerCase();
  let loader: DocumentLoader;
  if (fileExtension === '.csv') {
    loader = new CSVLoader(filePath);
  } else if (fileExtension === '.docx') {
    loader = new DocxLoader(filePath);
  } else if (fileExtension === '.doc') {
    loader = new DocxLoader(filePath, {
      type: 'doc',
    });
  } else if (fileExtension === '.json') {
    loader = new JSONLoader(filePath);
  } else if (fileExtension === '.pptx') {
    loader = new PPTXLoader(filePath);
  } else if (fileExtension === '.pdf') {
    loader = new PDFLoader(filePath);
  } else if (!isUnstructured) {
    loader = new TextLoader(filePath);
  } else {
    // TODO: Implement UnstructuredLoader
    // loader = new UnstructuredLoader(filePath, {
    //   apiUrl: process.env.UNSTRUCTURED_API_URL,
    //   strategy: 'fast',
    //   chunkingStrategy: 'by_title',
    //   combineUnderNChars: 2000,
    //   maxCharacters: 2000,
    // });
    throw new Error(`Unsupported file extension: ${fileExtension}`);
  }

  const docs = await loader.load();
  if (returnText) {
    return docs.map((doc) => doc.pageContent).join('\n\n');
  }

  return docs;
};

export const load = async (
  fileKey: string,
  returnText = false,
  isUnstructured = true,
) => {
  return withTempFile(fileKey, async (tempFilePath) => {
    await downloadFile(fileKey, tempFilePath);
    return loadFromFile(tempFilePath, returnText, isUnstructured);
  });
};

export const loadFromUrl = async (url: string, returnText = false) => {
  const logger = getLogger();
  const response = await fetch(url);
  if (!response.ok) {
    logger.error('Failed to fetch file from URL: {url}, status: {status}', {
      url,
      status: response.status,
    });
    throw new Error(`Failed to fetch file from URL: ${url}`);
  }

  const fileKey = path.basename(url);
  return withTempFile(fileKey, async (tempFilePath) => {
    const fileData = await response.arrayBuffer();
    await fs.writeFile(tempFilePath, Buffer.from(fileData));
    return loadFromFile(tempFilePath, returnText);
  });
};
