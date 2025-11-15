import { acquireLock, releaseLock } from '@repo/node-redis';
import type { MessageQueue } from '@/domain/external/message-queue.js';
import { getContextLogger } from '@/infrasturcture/logging/index.js';
import { redisClient } from '@/infrasturcture/storage/redis.js';

export const createRedisStreamMessageQueue = (
  streamName: string,
): MessageQueue => {
  const logger = getContextLogger();
  const lockExpireSeconds = 10;

  const put: MessageQueue['put'] = async (message) => {
    logger.info(`Putting message to ${streamName}, message: ${message.data}`);
    return await redisClient.xadd(streamName, '*', 'data', message.data);
  };

  const get: MessageQueue['get'] = async (startId, blockMs) => {
    logger.info(
      `Getting message from ${streamName}, startId: ${startId}, blockMs: ${blockMs}`,
    );
    if (!startId) {
      startId = '0-0';
    }
    const results = await redisClient.xread(
      'BLOCK',
      blockMs,
      'STREAMS',
      streamName,
      startId,
    );
    if (!results || results.length === 0) {
      return null;
    }

    const [_, messages] = results[0];
    if (!messages) {
      return null;
    }

    const [id, messageData] = messages[0];
    logger.info(
      `Got message from ${streamName}, id: ${id}, message: ${messageData}`,
    );
    return {
      id,
      message: {
        data: messageData[1],
      },
    };
  };

  const pop: MessageQueue['pop'] = async () => {
    logger.info(`Popping first message from ${streamName}`);
    const lockKey = `lock:${streamName}:pop`;
    const lockValue = await acquireLock(lockKey, lockExpireSeconds, 10);
    if (!lockValue) {
      return null;
    }
    try {
      const messages = await redisClient.xrange(
        streamName,
        '-',
        '+',
        'COUNT',
        1,
      );
      if (!messages || messages.length === 0) {
        return null;
      }

      const [id, messageData] = messages[0];
      await redisClient.xdel(streamName, id);

      return {
        id,
        message: {
          data: messageData[1],
        },
      };
    } catch (error) {
      logger.error(error, `Failed to pop message from ${streamName}`);
      return null;
    } finally {
      await releaseLock(lockKey, lockValue);
    }
  };

  const clear: MessageQueue['clear'] = async () => {
    logger.info(`Clearing ${streamName}`);
    await redisClient.xtrim(streamName, 'MAXLEN', 0);
  };

  const size: MessageQueue['size'] = async () => {
    return await redisClient.xlen(streamName);
  };

  const isEmpty: MessageQueue['isEmpty'] = async () => {
    const total = await size();
    return total === 0;
  };

  const deleteMessage: MessageQueue['deleteMessage'] = async (id) => {
    try {
      await redisClient.xdel(streamName, id);
      return true;
    } catch (error) {
      logger.error(error, `Failed to delete message from ${streamName}`);
      return false;
    }
  };

  return {
    put,
    get,
    pop,
    clear,
    size,
    isEmpty,
    deleteMessage,
  };
};
