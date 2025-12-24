import type { SearchResults } from '../model/search';
import type { ToolResult } from '../model/tool-result';

export interface SearchEngine {
  search(
    query: string,
    dataRange: string | null,
  ): Promise<ToolResult<SearchResults>>;
}
