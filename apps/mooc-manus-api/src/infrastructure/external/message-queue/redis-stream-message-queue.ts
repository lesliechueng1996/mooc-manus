import { randomUUIDv7 } from 'bun';
import type {
  Message,
  MessageData,
  MessageQueue,
} from '@/domain/external/message-queue';
import type { Logger } from '@/infrastructure/logging';
import { RedisClient } from '@/infrastructure/storage/redis';

export class RedisStreamMessageQueue implements MessageQueue {
  private readonly redisClient: RedisClient;

  constructor(
    private readonly logger: Logger,
    private readonly streamName: string,
  ) {
    this.redisClient = new RedisClient(logger);
  }

  async put(data: MessageData): Promise<string | null> {
    this.logger.info(
      `Putting message to ${this.streamName}, message: ${data.data}`,
    );
    return await this.redisClient.xadd(this.streamName, '*', 'data', data.data);
  }

  async get(startId: string | null, blockMs: number): Promise<Message | null> {
    this.logger.info(
      `Getting message from ${this.streamName}, startId: ${startId}, blockMs: ${blockMs}`,
    );
    if (!startId) {
      startId = '0-0';
    }
    const results = await this.redisClient.xread(
      'BLOCK',
      blockMs,
      'STREAMS',
      this.streamName,
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
    this.logger.info(
      `Got message from ${this.streamName}, id: ${id}, message: ${messageData}`,
    );
    return {
      id,
      message: {
        data: messageData[1],
      },
    };
  }

  async pop(): Promise<Message | null> {
    const lockExpireSeconds = 10;

    this.logger.info(`Popping first message from ${this.streamName}`);
    const lockKey = `lock:${this.streamName}:pop`;
    const lockValue = await this.redisClient.acquireLock(
      lockKey,
      randomUUIDv7(),
      lockExpireSeconds,
      10,
    );
    if (!lockValue) {
      return null;
    }
    try {
      const messages = await this.redisClient.xrange(
        this.streamName,
        '-',
        '+',
        'COUNT',
        1,
      );
      if (!messages || messages.length === 0) {
        return null;
      }

      const [id, messageData] = messages[0];
      await this.redisClient.xdel(this.streamName, id);

      return {
        id,
        message: {
          data: messageData[1],
        },
      };
    } catch (error) {
      this.logger.error(`Failed to pop message from ${this.streamName}`, {
        error,
      });
      return null;
    } finally {
      await this.redisClient.releaseLock(lockKey, lockValue);
    }
  }

  async clear(): Promise<void> {
    this.logger.info(`Clearing ${this.streamName}`);
    await this.redisClient.xtrim(this.streamName, 'MAXLEN', 0);
  }

  async size(): Promise<number> {
    return await this.redisClient.xlen(this.streamName);
  }

  async isEmpty(): Promise<boolean> {
    const size = await this.size();
    return size === 0;
  }

  async deleteMessage(id: string): Promise<boolean> {
    try {
      await this.redisClient.xdel(this.streamName, id);
      return true;
    } catch (error) {
      this.logger.error(`Failed to delete message from ${this.streamName}`, {
        error,
      });
      return false;
    }
  }
}
