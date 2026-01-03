import { CacheBackedEmbeddings } from '@repo/internal-langchain';
import { RedisByteStore } from '@repo/internal-langchain/community';
import { OpenAIEmbeddings } from '@repo/internal-langchain/openai';
import { getDefaultRedisClient } from '@repo/redis-client';

export const createCacheBackedEmbedding = () => {
  const embeddings = new OpenAIEmbeddings({
    model: 'text-embedding-3-small',
  });

  const redisStore = new RedisByteStore({
    client: getDefaultRedisClient(),
  });

  const cacheBackedEmbedding = CacheBackedEmbeddings.fromBytesStore(
    embeddings,
    redisStore,
    {
      namespace: 'embeddings',
    },
  );

  return cacheBackedEmbedding;
};
