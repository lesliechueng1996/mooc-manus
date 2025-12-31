import { randomUUID } from 'node:crypto';
import { getLogger, NotFoundException } from '@repo/common';
import { type Prisma, prisma } from '@repo/prisma-database';
import { format } from 'date-fns';
import { buildDocumentsAyncTask } from '../task/document-task';
import {
  DocumentStatus,
  type PreProcessRuleId,
  type ProcessType,
} from '../types';

export const createDocuments = async (
  userId: string,
  data: {
    datasetId: string;
    uploadFileIds: string[];
    processType: ProcessType;
    rule: {
      preProcessRules: {
        id: PreProcessRuleId;
        enabled: boolean;
      }[];
      segment: {
        separators: string[];
        chunkSize: number;
        chunkOverlap: number;
      };
    };
  },
) => {
  const logger = getLogger();

  const datasetQuery = prisma.dataset.findUnique({
    where: {
      id: data.datasetId,
      userId,
    },
  });
  const uploadFileQuery = prisma.uploadFile.findMany({
    where: {
      id: {
        in: data.uploadFileIds,
      },
      userId,
    },
  });

  const [datasetRecord, uploadFileRecords] = await Promise.all([
    datasetQuery,
    uploadFileQuery,
  ]);

  if (!datasetRecord) {
    throw new NotFoundException('Dataset not found');
  }

  if (uploadFileRecords.length === 0) {
    throw new NotFoundException('Upload files not found');
  }

  const batchId = `${format(new Date(), 'yyyyMMddHHmmss')}-${randomUUID()}`;
  logger.info('Generated batch ID: {batchId}', { batchId });

  const lastDocumentPosition = await prisma.document.findFirst({
    where: {
      userId,
      datasetId: data.datasetId,
    },
    orderBy: {
      position: 'desc',
    },
  });
  let lastPosition = lastDocumentPosition?.position ?? 0;
  logger.info('Current maximum position value: {lastPosition}', {
    lastPosition,
  });

  const processRuleRecord = await prisma.processRule.create({
    data: {
      userId,
      datasetId: data.datasetId,
      mode: data.processType,
      rule: data.rule,
      documents: {
        create: uploadFileRecords.map((record) => {
          lastPosition++;
          return {
            userId,
            datasetId: data.datasetId,
            uploadFileId: record.id,
            status: DocumentStatus.WAITING,
            batch: batchId,
            name: record.name,
            position: lastPosition,
          };
        }),
      },
    },
    include: {
      documents: true,
    },
  });

  const documentIds = processRuleRecord.documents.map((doc) => doc.id);
  logger.info('New created document IDs: {documentIds}', {
    documentIds: documentIds.join(','),
  });

  buildDocumentsAyncTask(data.datasetId, documentIds);

  return {
    documents: processRuleRecord.documents.map((doc) => ({
      id: doc.id,
      name: doc.name,
      status: doc.status,
      createdAt: doc.createdAt.getTime(),
    })),
    batch: batchId,
  };
};

export const getDocumentsByBatch = async (
  datasetId: string,
  batchId: string,
  userId: string,
) => {
  const logger = getLogger();

  const docs = await prisma.document.findMany({
    where: {
      userId,
      batch: batchId,
      datasetId,
    },
  });

  if (docs.length === 0) {
    logger.warn(`No documents found for batch: {batchId}`, { batchId });
    throw new NotFoundException('No documents found for batch');
  }

  const uploadFileIds = docs.map((doc) => doc.uploadFileId);
  const uploadFileQuery = prisma.uploadFile.findMany({
    where: {
      id: {
        in: uploadFileIds,
      },
    },
  });
  const segmentQuery = prisma.segment.groupBy({
    by: ['documentId'],
    _count: {
      id: true,
    },
    where: {
      userId,
      datasetId,
      documentId: {
        in: docs.map((doc) => doc.id),
      },
    },
  });

  const completedSegmentQuery = prisma.segment.groupBy({
    by: ['documentId'],
    _count: {
      id: true,
    },
    where: {
      userId,
      datasetId,
      documentId: {
        in: docs.map((doc) => doc.id),
      },
      status: DocumentStatus.COMPLETED,
    },
  });

  const [uploadFileRecords, segmentRecords, completedSegmentRecords] =
    await Promise.all([uploadFileQuery, segmentQuery, completedSegmentQuery]);

  const uploadFileMap = uploadFileRecords.reduce(
    (acc, record) => {
      acc[record.id] = record;
      return acc;
    },
    {} as Record<string, Prisma.UploadFileModel>,
  );

  const docSegmentCountMap = segmentRecords.reduce(
    (acc, record) => {
      acc[record.documentId] = record._count.id;
      return acc;
    },
    {} as Record<string, number>,
  );

  const docCompletedSegmentCountMap = completedSegmentRecords.reduce(
    (acc, record) => {
      acc[record.documentId] = record._count.id;
      return acc;
    },
    {} as Record<string, number>,
  );

  return docs.map((doc) => {
    const uploadFileRecord = uploadFileMap[doc.uploadFileId];

    return {
      id: doc.id,
      name: doc.name,
      size: uploadFileRecord?.size ?? 0,
      extension: uploadFileRecord?.extension ?? 'N/A',
      mimeType: uploadFileRecord?.mimeType ?? 'N/A',
      position: doc.position,
      segmentCount: docSegmentCountMap[doc.id] ?? 0,
      completedSegmentCount: docCompletedSegmentCountMap[doc.id] ?? 0,
      error: doc.error ?? '',
      status: doc.status as DocumentStatus,
      processingStartedAt: doc.processingStartedAt?.getTime() ?? 0,
      parsingCompletedAt: doc.parsingCompletedAt?.getTime() ?? 0,
      splittingCompletedAt: doc.splittingCompletedAt?.getTime() ?? 0,
      indexingCompletedAt: doc.indexingCompletedAt?.getTime() ?? 0,
      completedAt: doc.completedAt?.getTime() ?? 0,
      stoppedAt: doc.stoppedAt?.getTime() ?? 0,
      createdAt: doc.createdAt.getTime(),
    };
  });
};
