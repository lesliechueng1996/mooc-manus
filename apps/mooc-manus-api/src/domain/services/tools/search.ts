import type { SearchEngine } from '@/domain/external/search';
import { ToolCollection, tool } from './base';

type SearchWebParams = {
  query: string;
  dataRange: string | null;
};

export class SearchWebToolCollection extends ToolCollection {
  constructor(private readonly searchEngine: SearchEngine) {
    super('search_web_tools');
  }

  @tool({
    name: 'search_web',
    description:
      'Web search engine tool used when real-time information is needed (such as breaking news, weather), to supplement content not covered by the internal knowledge base, or to perform fact-checking. This tool returns summaries and links of relevant web pages.',
    parameters: {
      query: {
        type: 'string',
        description:
          'Search engine optimized query string. Extract core entities and keywords (3-5) from the question, avoid using complete natural language sentences (e.g., change "What is the weather like in Beijing today?" to "Beijing weather")',
      },
      dataRange: {
        type: 'string',
        enum: [
          'all',
          'past_hour',
          'past_day',
          'past_week',
          'past_month',
          'past_year',
        ],
        description:
          '(Optional) Time range filter for search results. Must be specified when users ask about time-sensitive news or events (e.g., "yesterday", "last week"). Defaults to "all"',
      },
    },
    required: ['query'],
  })
  async searchWebTool(params: SearchWebParams) {
    const { query, dataRange } = params;
    return this.searchEngine.search(query, dataRange);
  }
}
