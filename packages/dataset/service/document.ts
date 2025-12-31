import { randomUUID } from 'node:crypto';
import { getLogger, NotFoundException } from '@repo/common';
import { prisma } from '@repo/prisma-database';
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
