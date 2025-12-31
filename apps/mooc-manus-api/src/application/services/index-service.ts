import { Logger } from '@/infrastructure/logging';
import { databaseClient } from '@/infrastructure/storage/database';
import { calculateTokenCount, hashText, NotFoundException } from '@repo/common';
import {
  cleanText,
  createTextSplitter,
  DocumentStatus,
  getOrCreateKeywordTable,
  load,
  SegmentStatus,
} from '@repo/dataset';
import type { Prisma } from '@repo/prisma-database';
import type { Document } from '@repo/internal-langchain';
import { randomUUID } from 'node:crypto';

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

    return langchainDocs;
  }

  private async splittingDocument(
    doc: Prisma.DocumentModel,
    langchainDocs: Document[],
  ) {
    this.logger.info('Start splitting document {id}', { id: doc.id });
    // 获取处理规则，用于控制文档分割的方式
    const processRuleRecord = await databaseClient.processRule.findUnique({
      where: {
        id: doc.processRuleId,
      },
    });

    if (!processRuleRecord) {
      this.logger.error('No process rule found {id}', {
        id: doc.processRuleId,
      });
      throw new NotFoundException(`No process rule found ${doc.processRuleId}`);
    }
    this.logger.info('Process rule records: {processRuleRecord}', {
      processRuleRecord,
    });

    // 创建文本分割器，根据处理规则和token计算方式
    const textSplitter = createTextSplitter(
      processRuleRecord,
      calculateTokenCount,
    );
    // 清理每个文档片段的文本内容
    this.logger.info('Clean text before splitting.');
    for (const langchainDoc of langchainDocs) {
      langchainDoc.pageContent = cleanText(
        processRuleRecord,
        langchainDoc.pageContent,
      );
    }

    // 使用分割器将文档分割成更小的片段
    this.logger.info('Split documents.');
    const langchainSegments = await textSplitter.splitDocuments(langchainDocs);
    this.logger.info('Split documents completed.');

    // 获取最后一个片段的位置，用于确定新片段的位置

    const segmentPositionRecord = await databaseClient.segment.findFirst({
      where: {
        documentId: doc.id,
      },
      orderBy: {
        position: 'desc',
      },
    });
    let lastSegmentPosition = segmentPositionRecord?.position ?? 0;
    this.logger.info('Last segment position: {lastSegmentPosition}', {
      lastSegmentPosition,
    });

    // 准备片段数据，包括计算token数量和生成唯一标识
    const segments: Prisma.SegmentCreateManyInput[] = [];
    let docTokenCount = 0;
    for (const langchainSegment of langchainSegments) {
      lastSegmentPosition++;
      const content = langchainSegment.pageContent;
      const segmentTokenCount = calculateTokenCount(content);
      docTokenCount += segmentTokenCount;
      // 创建新的片段记录，包含完整的元数据
      const segment = {
        userId: doc.userId,
        datasetId: doc.datasetId,
        documentId: doc.id,
        nodeId: randomUUID(), // 生成唯一节点ID
        position: lastSegmentPosition,
        content,
        characterCount: content.length,
        tokenCount: segmentTokenCount,
        hash: hashText(content), // 计算内容哈希值，用于去重
        status: SegmentStatus.WAITING,
      };
      segments.push(segment);
    }

    this.logger.info('Save segments.');
    // 在事务中保存片段并更新文档状态，确保数据一致性

    const [segmentRecords, _] = await databaseClient.$transaction([
      databaseClient.segment.createManyAndReturn({
        data: segments,
      }),
      databaseClient.document.update({
        where: { id: doc.id },
        data: {
          tokenCount: docTokenCount,
          status: DocumentStatus.INDEXING,
          splittingCompletedAt: new Date(),
        },
      }),
    ]);

    // 更新 LangChain 文档片段的元数据，添加必要的标识信息
    for (let i = 0; i < langchainSegments.length; i++) {
      const segmentRecord = segmentRecords[i];
      langchainSegments[i].metadata = {
        ...langchainSegments[i].metadata,
        user_id: segmentRecord.userId,
        dataset_id: segmentRecord.datasetId,
        document_id: segmentRecord.documentId,
        segment_id: segmentRecord.id,
        node_id: segmentRecord.nodeId,
        document_enabled: false, // 初始状态为禁用
        segment_enabled: false, // 初始状态为禁用
      };
    }

    this.logger.info(
      'Document {id} splitting completed, segment count: {segmentCount}',
      { id: doc.id, segmentCount: langchainSegments.length },
    );

    return langchainSegments;
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
        const langchainSegments = await this.splittingDocument(
          documentRecord,
          langchainDocs,
        );
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
