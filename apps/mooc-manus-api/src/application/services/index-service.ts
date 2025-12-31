import { Logger } from '@/infrastructure/logging';
import { databaseClient } from '@/infrastructure/storage/database';
import { NotFoundException } from '@repo/common';
import { DocumentStatus, getOrCreateKeywordTable, load } from '@repo/dataset';
import type { Prisma } from '@repo/prisma-database';
import type { Document } from '@repo/internal-langchain';

export class IndexService {
  private readonly logger: Logger;

  constructor(userId: string, requestId: string) {
    this.logger = new Logger(requestId, userId);
  }

  private cleanExtraText(text: string) {
    // 清理特殊标记，替换为标准的HTML标签
    let result = text.replace(/<\|/g, '<');
    result = result.replace(/\|>/g, '>');
    // 用字符串构造 RegExp，避免控制字符导致的语法错误
    const controlChars = '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\uFFFE]';
    // 清理所有控制字符
    result = result.replace(new RegExp(controlChars, 'g'), '');
    // 清理特殊Unicode字符
    result = result.replace(/\uFFFE/g, '');
    return result;
  }

  private async parsingDocument(doc: Prisma.DocumentModel) {
    this.logger.info('Start parsing document {id}', { id: doc.id });
    const uploadFileRecord = await databaseClient.uploadFile.findUnique({
      where: {
        id: doc.uploadFileId,
      },
    });
    if (!uploadFileRecord) {
      this.logger.error('Upload file {id} not found', { id: doc.uploadFileId });
      throw new NotFoundException(`Upload file ${doc.uploadFileId} not found`);
    }
    // 使用文件提取器加载文档内容，支持多种文件格式
    const langchainDocs = (await load(
      uploadFileRecord.key,
      false,
      true,
    )) as Document[];

    // 清理文本并计算字符数，为后续处理做准备
    let characterCount = 0;
    for (const langchainDoc of langchainDocs) {
      // 清理文本中的特殊字符和控制字符
      langchainDoc.pageContent = this.cleanExtraText(langchainDoc.pageContent);
      characterCount += langchainDoc.pageContent.length;
    }

    // 更新文档状态为分割中，记录解析完成时间
    await databaseClient.document.update({
      where: { id: doc.id },
      data: {
        characterCount,
        status: DocumentStatus.SPLITTING,
        parsingCompletedAt: new Date(),
      },
    });

    this.logger.info(
      'Document {id} parsing complated, character count: {characterCount}, langchain docs length: {langchainDocsLength}',
      { id: doc.id, characterCount, langchainDocsLength: langchainDocs.length },
    );

    return {
      docs: langchainDocs,
      characterCount,
    };
  }

  async buildDocuments(documentIds: string[], datasetId: string) {
    if (!documentIds || documentIds.length === 0) {
      this.logger.warn('No document ids provided');
      return;
    }

    this.logger.info(`Building documents: ${documentIds.join(', ')}`);

    const documentsQuery = databaseClient.document.findMany({
      where: {
        id: {
          in: documentIds,
        },
        datasetId,
      },
    });

    const keywordTableQuery = getOrCreateKeywordTable(datasetId);

    const [documentRecords, keywordTableRecord] = await Promise.all([
      documentsQuery,
      keywordTableQuery,
    ]);

    for (const documentRecord of documentRecords) {
      try {
        this.logger.info('Update document {id} status to parsing', {
          id: documentRecord.id,
        });
        await databaseClient.document.update({
          where: { id: documentRecord.id },
          data: {
            status: DocumentStatus.PARSING,
            processingStartedAt: new Date(),
          },
        });

        // Four main steps of document processing, and status transitions.
        // 1. Parsing document: extract text content from the original file
        const langchainDocs = await this.parsingDocument(documentRecord);
        // TODO: Other steps of document processing
        // 2. Splitting document: split the document into smaller fragments, for easier subsequent processing
        // const langchainSegments = await splittingDocument(
        //   documentRecord,
        //   langchainDocs,
        // );
        // // 3. Indexing document: create a keyword index for the document fragments, support for subsequent search
        // await indexingDocument(
        //   documentRecord,
        //   langchainSegments,
        //   keywordTableRecord,
        // );
        // // 4. Saving document: store the processed document fragments into the vector database
        // await savingDocument(documentRecord, langchainSegments);
      } catch (error) {
        this.logger.error('Build document {id} failed!', {
          id: documentRecord.id,
          error,
        });
        await databaseClient.document.update({
          where: { id: documentRecord.id },
          data: {
            status: DocumentStatus.ERROR,
            error:
              error instanceof Error ? error.message : JSON.stringify(error),
            stoppedAt: new Date(),
          },
        });
      }
    }
  }
}
