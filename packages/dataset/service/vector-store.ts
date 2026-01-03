import { PGVectorStore } from '@repo/internal-langchain/community';
import type { PoolConfig } from 'pg';
import { createCacheBackedEmbedding } from './embedding';

const config = {
  postgresConnectionOption: {
    type: 'postgres',
    host: process.env.PG_VECTOR_HOST || 'localhost',
    port: parseInt(process.env.PG_VECTOR_PORT || '5433', 10),
    username: process.env.PG_VECTOR_USERNAME || 'postgres',
    password: process.env.PG_VECTOR_PASSWORD || 'postgres',
    database: process.env.PG_VECTOR_DATABASE || 'manus',
  } as PoolConfig,
  tableName: 'mooc_manus_vector_store',
  columns: {
    idColumnName: 'id',
    vectorColumnName: 'vector',
    contentColumnName: 'content',
    metadataColumnName: 'metadata',
  },
};

let vectorStore: PGVectorStore;

export const initVectorStore = async () => {
  if (vectorStore) {
    return vectorStore;
  }

  vectorStore = await PGVectorStore.initialize(
    createCacheBackedEmbedding(),
    config,
  );
};

export const vectorStoreRetriever = async () => {
  if (!vectorStore) {
    await initVectorStore();
  }

  return vectorStore.asRetriever();
};

export const getVectorStore = async () => {
  if (!vectorStore) {
    await initVectorStore();
  }

  return vectorStore;
};
