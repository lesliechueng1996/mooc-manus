import { z } from 'zod';

const searchResultItemSchema = z.object({
  url: z.string(),
  title: z.string(),
  snippet: z.string().default(''),
});

type SearchResultItemProps = z.infer<typeof searchResultItemSchema>;

export class SearchResultItem {
  constructor(private readonly props: SearchResultItemProps) {}

  get url(): string {
    return this.props.url;
  }

  get title(): string {
    return this.props.title;
  }

  get snippet(): string {
    return this.props.snippet;
  }

  static schema = searchResultItemSchema.transform(
    (data) => new SearchResultItem(data),
  );
}

const searchResultsSchema = z.object({
  query: z.string(),
  dataRange: z.string().nullable().default(null),
  totalResults: z.int().default(0),
  results: z.array(searchResultItemSchema).default([]),
});

type SearchResultsProps = z.infer<typeof searchResultsSchema>;

export class SearchResults {
  constructor(private readonly props: SearchResultsProps) {}

  get query(): string {
    return this.props.query;
  }

  get dataRange(): string | null {
    return this.props.dataRange;
  }

  get totalResults(): number {
    return this.props.totalResults;
  }

  get results() {
    return this.props.results;
  }

  static schema = searchResultsSchema.transform(
    (data) => new SearchResults(data),
  );
}
