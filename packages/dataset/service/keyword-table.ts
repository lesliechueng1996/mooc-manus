import { randomUUID } from 'node:crypto';
import { Logger } from '@repo/common';
import { type Prisma, prisma } from '@repo/prisma-database';
import { getDefaultRedisClient, RedisClient } from '@repo/redis-client';

export const LOCK_KEYWORD_TABLE_UPDATE_KEYWORD_TABLE =
  'lock:keyword_table:update:keyword_table_{dataset_id}';

export const getOrCreateKeywordTable = async (datasetId: string) => {
  const keywordTableRecord = await prisma.keywordTable.findUnique({
    where: {
      datasetId,
    },
  });

  if (keywordTableRecord) {
    return keywordTableRecord;
  }

  const newKeywordTableRecord = await prisma.keywordTable.create({
    data: {
      datasetId,
    },
  });
  return newKeywordTableRecord;
};

export const buildKeywordMap = (
  keywordTableRecord: Prisma.KeywordTableModel,
) => {
  const keywords = keywordTableRecord.keywords as Record<string, string[]>;
  const allKeywordMap = new Map<string, Set<string>>();
  for (const keywordKey of Object.keys(keywords)) {
    const keywordValues = keywords[keywordKey] ?? [];
    if (!allKeywordMap.has(keywordKey)) {
      allKeywordMap.set(keywordKey, new Set());
    }
    for (const keywordValue of keywordValues) {
      allKeywordMap.get(keywordKey)?.add(keywordValue);
    }
  }
  return allKeywordMap;
};

export const formatKeywordMap = (
  keywordMap: Map<string, Set<string> | Array<string>>,
) => {
  const result: Record<string, string[]> = {};
  for (const [keyword, values] of keywordMap.entries()) {
    result[keyword] = Array.from(values);
  }
  return result;
};

export const addKeywordTableFromSegmentIds = async (
  datasetId: string,
  segmentIds: string[],
) => {
  const logger = new Logger();
  const redisClient = new RedisClient(getDefaultRedisClient(), logger);
  const lockKey = LOCK_KEYWORD_TABLE_UPDATE_KEYWORD_TABLE.replace(
    '{dataset_id}',
    datasetId,
  );
  const lockValue = randomUUID();
  const lockAcquired = await redisClient.acquireLock(lockKey, lockValue);
  if (!lockAcquired) {
    logger.error(
      'Add keyword table failed, lock acquisition failed, datasetId: {datasetId}, segmentIds: {segmentIds}',
      { datasetId, segmentIds },
    );
    return;
  }

  try {
    const keywordTableRecord = await getOrCreateKeywordTable(datasetId);
    const allKeywordMap = buildKeywordMap(keywordTableRecord);
    logger.info(
      'Before add keyword table count: {count}, datasetId: {datasetId}',
      { count: allKeywordMap.size, datasetId },
    );

    const segmentRecords = await prisma.segment.findMany({
      select: {
        id: true,
        keywords: true,
      },
      where: {
        id: {
          in: segmentIds,
        },
      },
    });

    for (const segmentRecord of segmentRecords) {
      const keywords = segmentRecord.keywords as string[];
      for (const keyword of keywords) {
        if (!allKeywordMap.has(keyword)) {
          allKeywordMap.set(keyword, new Set());
        }
        allKeywordMap.get(keyword)?.add(segmentRecord.id);
      }
    }

    logger.info(
      'After add keyword table count: {count}, datasetId: {datasetId}',
      { count: allKeywordMap.size, datasetId },
    );

    await prisma.keywordTable.update({
      where: {
        id: keywordTableRecord.id,
      },
      data: {
        keywords: formatKeywordMap(allKeywordMap),
      },
    });
  } catch (err) {
    logger.error(
      'Add keyword table failed, datasetId: {datasetId}, segmentIds: {segmentIds}',
      { error: err, datasetId, segmentIds },
    );
    throw err;
  } finally {
    await redisClient.releaseLock(lockKey, lockValue);
  }
};

export const deleteKeywordTableFromSegmentIds = async (
  datasetId: string,
  segmentIds: string[],
) => {
  const logger = new Logger();
  const redisClient = new RedisClient(getDefaultRedisClient(), logger);
  const lockKey = LOCK_KEYWORD_TABLE_UPDATE_KEYWORD_TABLE.replace(
    '{dataset_id}',
    datasetId,
  );
  const lockValue = randomUUID();
  const lockAcquired = await redisClient.acquireLock(lockKey, lockValue);
  if (!lockAcquired) {
    logger.error(
      'Delete keyword table failed, lock acquisition failed, datasetId: {datasetId}, segmentIds: {segmentIds}',
      { datasetId, segmentIds },
    );
    return;
  }
  try {
    const deletedSegmentIdsSet = new Set<string>(segmentIds);

    const keywordTableRecord = await getOrCreateKeywordTable(datasetId);
    const keywords = keywordTableRecord.keywords as Record<string, string[]>;

    logger.info(
      'Before delete keyword table count: {count}, datasetId: {datasetId}',
      { count: Object.keys(keywords).length, datasetId },
    );
    const remainKeywordMap = new Map<string, Array<string>>();
    for (const keyword of Object.keys(keywords)) {
      const keywordValuesSet = new Set(keywords[keyword]);
      const diff = keywordValuesSet.difference(deletedSegmentIdsSet);
      if (diff.size > 0) {
        remainKeywordMap.set(keyword, Array.from(diff));
      }
    }
    logger.info(
      'After delete keyword table count: {count}, datasetId: {datasetId}',
      { count: remainKeywordMap.size, datasetId },
    );

    await prisma.keywordTable.update({
      where: {
        id: keywordTableRecord.id,
      },
      data: {
        keywords: formatKeywordMap(remainKeywordMap),
      },
    });
  } catch (error) {
    logger.error(
      'Delete keyword table failed, datasetId: {datasetId}, segmentIds: {segmentIds}',
      { error, datasetId, segmentIds },
    );
    throw error;
  } finally {
    await redisClient.releaseLock(lockKey, lockValue);
  }
};
