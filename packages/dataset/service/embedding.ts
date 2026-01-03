import { CacheBackedEmbeddings } from '@repo/internal-langchain';
import { RedisByteStore } from '@repo/internal-langchain/community';
import { OpenAIEmbeddings } from '@repo/internal-langchain/openai';
import Redis from 'ioredis';

const redisClient = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  db: parseInt(process.env.REDIS_DB || '0', 10),
});

const embeddings = new OpenAIEmbeddings({
  model: 'text-embedding-3-small',
});

const redisStore = new RedisByteStore({
  client: redisClient,
});

export const cacheBackedEmbedding = CacheBackedEmbeddings.fromBytesStore(
  embeddings,
  redisStore,
  {
    namespace: 'embeddings',
  },
);
