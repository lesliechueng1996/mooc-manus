import { z } from 'zod';

const searchResultItemSchema = z.object({
  url: z.string(),
  title: z.string(),
  snippet: z.string().default(''),
});

export type SearchResultItem = z.infer<typeof searchResultItemSchema>;

const searchResultsSchema = z.object({
  query: z.string(),
  dataRange: z.string().nullable().default(null),
  totalResults: z.int().default(0),
  results: z.array(searchResultItemSchema).default([]),
});

export type SearchResults = z.infer<typeof searchResultsSchema>;
