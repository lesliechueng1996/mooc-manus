import { randomUUID } from 'node:crypto';
import {
  calculateTokenCount,
  createParallelTask,
  hashText,
  NotFoundException,
} from '@repo/common';
import {
  buildKeywordMap,
  cleanText,
  createTextSplitter,
  DocumentStatus,
  extractKeywords,
  formatKeywordMap,
  getOrCreateKeywordTable,
  getVectorStore,
  load,
  SegmentStatus,
} from '@repo/dataset';
import type { Document } from '@repo/internal-langchain';
import type { Prisma } from '@repo/prisma-database';
import { Logger } from '@/infrastructure/logging';
import { databaseClient } from '@/infrastructure/storage/database';

export class IndexService {
  private readonly logger: Logger;

  constructor(userId: string, requestId: string) {
    this.logger = new Logger(requestId, userId);
  }

  private cleanExtraText(text: string) {
    // Clean special markers and replace with standard HTML tags
    let result = text.replace(/<\|/g, '<');
    result = result.replace(/\|>/g, '>');
    // Construct RegExp with string to avoid syntax errors caused by control characters
    const controlChars = '[\x00-\x08\x0B\x0C\x0E-\x1F\x7F\uFFFE]';
    // Clean all control characters
    result = result.replace(new RegExp(controlChars, 'g'), '');
    // Clean special Unicode characters
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
    // Use file extractor to load document content, supporting multiple file formats
    const langchainDocs = (await load(
      uploadFileRecord.key,
      false,
      true,
    )) as Document[];

    // Clean text and calculate character count, preparing for subsequent processing
    let characterCount = 0;
    for (const langchainDoc of langchainDocs) {
      // Clean special characters and control characters in the text
      langchainDoc.pageContent = this.cleanExtraText(langchainDoc.pageContent);
      characterCount += langchainDoc.pageContent.length;
    }

    // Update document status to splitting, record parsing completion time
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
    // Get processing rules to control document splitting method
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

    // Create text splitter based on processing rules and token calculation method
    const textSplitter = createTextSplitter(
      processRuleRecord,
      calculateTokenCount,
    );
    // Clean text content of each document fragment
    this.logger.info('Clean text before splitting.');
    for (const langchainDoc of langchainDocs) {
      langchainDoc.pageContent = cleanText(
        processRuleRecord,
        langchainDoc.pageContent,
      );
    }

    // Use splitter to split document into smaller fragments
    this.logger.info('Split documents.');
    const langchainSegments = await textSplitter.splitDocuments(langchainDocs);
    this.logger.info('Split documents completed.');

    // Get the position of the last segment to determine the position of new segments

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

    // Prepare segment data, including calculating token count and generating unique identifiers
    const segments: Prisma.SegmentCreateManyInput[] = [];
    let docTokenCount = 0;
    for (const langchainSegment of langchainSegments) {
      lastSegmentPosition++;
      const content = langchainSegment.pageContent;
      const segmentTokenCount = calculateTokenCount(content);
      docTokenCount += segmentTokenCount;
      // Create new segment record with complete metadata
      const segment = {
        userId: doc.userId,
        datasetId: doc.datasetId,
        documentId: doc.id,
        nodeId: randomUUID(), // Generate unique node ID
        position: lastSegmentPosition,
        content,
        characterCount: content.length,
        tokenCount: segmentTokenCount,
        hash: hashText(content), // Calculate content hash for deduplication
        status: SegmentStatus.WAITING,
      };
      segments.push(segment);
    }

    this.logger.info('Save segments.');
    // Save segments and update document status in a transaction to ensure data consistency

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

    // Update LangChain document segment metadata with necessary identification information
    for (let i = 0; i < langchainSegments.length; i++) {
      const segmentRecord = segmentRecords[i];
      langchainSegments[i].metadata = {
        ...langchainSegments[i].metadata,
        user_id: segmentRecord.userId,
        dataset_id: segmentRecord.datasetId,
        document_id: segmentRecord.documentId,
        segment_id: segmentRecord.id,
        node_id: segmentRecord.nodeId,
        document_enabled: false, // Initial state is disabled
        segment_enabled: false, // Initial state is disabled
      };
    }

    this.logger.info(
      'Document {id} splitting completed, segment count: {segmentCount}',
      { id: doc.id, segmentCount: langchainSegments.length },
    );

    return langchainSegments;
  }

  private async indexingDocument(
    doc: Prisma.DocumentModel,
    langchainSegments: Document[],
    keywordTableRecord: Prisma.KeywordTableModel,
  ) {
    this.logger.info('Start indexing document {id}', { id: doc.id });
    // Initialize keyword mapping to store keywords and corresponding segment IDs
    const keywordMapping = buildKeywordMap(keywordTableRecord);

    // Process each document segment, extract keywords and update index
    for (const langchainSegment of langchainSegments) {
      // Extract keywords from segment, limited to top 10
      const segmentKeywords = extractKeywords(langchainSegment.pageContent, 10);
      // Update segment status and keywords
      await databaseClient.segment.update({
        where: { id: langchainSegment.metadata.segment_id },
        data: {
          keywords: segmentKeywords,
          status: SegmentStatus.INDEXING,
          indexingCompletedAt: new Date(),
        },
      });

      // Update keyword mapping to establish association between keywords and segments
      for (const segmentKeyword of segmentKeywords) {
        if (!keywordMapping.has(segmentKeyword)) {
          keywordMapping.set(segmentKeyword, new Set());
        }
        keywordMapping
          .get(segmentKeyword)
          ?.add(langchainSegment.metadata.segment_id);
      }
    }

    this.logger.info('Document {id} all segments indexed', { id: doc.id });
    await databaseClient.$transaction([
      databaseClient.keywordTable.update({
        where: { id: keywordTableRecord.id },
        data: {
          keywords: formatKeywordMap(keywordMapping),
        },
      }),
      databaseClient.document.update({
        where: { id: doc.id },
        data: {
          indexingCompletedAt: new Date(),
        },
      }),
    ]);
  }

  private async savingDocument(
    doc: Prisma.DocumentModel,
    langchainSegments: Document[],
  ) {
    this.logger.info('Start saving document {id}', { id: doc.id });
    // Enable document and segments, prepare for storage
    for (const langchainSegment of langchainSegments) {
      langchainSegment.metadata.document_enabled = true;
      langchainSegment.metadata.segment_enabled = true;
    }

    const vectorStore = await getVectorStore();

    // Use parallel tasks to handle batch storage, improving performance
    const task = createParallelTask(10); // Limit concurrency to 10
    for (let i = 0; i < langchainSegments.length; i += 10) {
      const segmentBatch = langchainSegments.slice(i, i + 10);
      const ids = segmentBatch.map((item) => item.metadata.node_id as string);
      task.addTask(async () => {
        // Add segments to vector store, supporting similarity search
        await vectorStore.addDocuments(segmentBatch, {
          ids,
        });

        // Update segment status to completed, enable segments
        await databaseClient.segment.updateMany({
          where: { nodeId: { in: ids } },
          data: {
            status: SegmentStatus.COMPLETED,
            completedAt: new Date(),
            enabled: true,
          },
        });
      });
    }

    // Wait for all storage tasks to complete
    await task.run();
    this.logger.info('Document {id} all segments completed', { id: doc.id });
    // Update document status to completed, enable document
    await databaseClient.document.update({
      where: { id: doc.id },
      data: {
        status: DocumentStatus.COMPLETED,
        completedAt: new Date(),
        enabled: true,
      },
    });

    this.logger.info('Document {id} completed', { id: doc.id });
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
        await this.indexingDocument(
          documentRecord,
          langchainSegments,
          keywordTableRecord,
        );
        // // 4. Saving document: store the processed document fragments into the vector database
        await this.savingDocument(documentRecord, langchainSegments);
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
