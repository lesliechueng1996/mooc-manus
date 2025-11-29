import type { SearchResults } from '../models/search';
import type { ToolResult } from '../models/tool-result';

export interface SearchEngine {
  search(
    query: string,
    dataRange: string | null,
  ): Promise<ToolResult<SearchResults>>;
}
