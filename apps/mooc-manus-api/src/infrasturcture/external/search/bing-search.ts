import type { SearchEngine } from '@/domain/external/search';
import { SearchResultItem, SearchResults } from '@/domain/models/search';
import type { ToolResult } from '@/domain/models/tool-result';
import { getContextLogger } from '@/infrasturcture/logging';
import type { Logger } from '@repo/pino-log';
import * as cheerio from 'cheerio';

export class BingSearch implements SearchEngine {
  private readonly baseUrl: string = 'https://www.bing.com/search';
  private readonly headers: Record<string, string> = {
    'User-Agent':
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/142.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.5',
    'Accept-Encoding': 'gzip, deflate',
    Connection: 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
  };
  private readonly logger: Logger;

  constructor() {
    this.logger = getContextLogger();
  }

  async search(
    query: string,
    dataRange: string | null,
  ): Promise<ToolResult<SearchResults>> {
    const params: Record<string, string> = { q: query };
    if (dataRange && dataRange !== 'all') {
      const daysSinceEpoch = Math.floor(Date.now() / (1000 * 60 * 60 * 24));
      const dateMappings: Record<string, string> = {
        past_hour: 'ex1%3a"ez1"',
        past_day: 'ex1%3a"ez1"',
        past_week: 'ex1%3a"ez2"',
        past_month: 'ex1%3a"ez3"',
        past_year: `ex1%3a"ez5_${daysSinceEpoch - 365}_${daysSinceEpoch}"`,
      };
      if (dataRange in dateMappings) {
        params.filters = dateMappings[dataRange];
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60秒超时

    try {
      const response = await fetch(
        `${this.baseUrl}?${new URLSearchParams(params).toString()}`,
        {
          headers: this.headers,
          signal: controller.signal,
          redirect: 'follow', // 自动跟随重定向（默认行为，显式声明）
        },
      );

      // 检查响应状态
      if (!response.ok) {
        throw new Error(
          `Bing search returned status ${response.status}: ${response.statusText}`,
        );
      }
      const html = await response.text();

      const searchResults: SearchResultItem[] = [];
      const $ = cheerio.load(html);
      const resultElements = $('li.b_algo');
      for (const resultElement of resultElements) {
        try {
          const h2Element = $(resultElement).find('h2');
          let title = '';
          let url = '';

          if (h2Element.length > 0) {
            const aElement = h2Element.find('a');
            if (aElement.length > 0) {
              title = aElement.text().trim();
              url = aElement.attr('href') ?? '';
            }
          }

          if (!title) {
            const aElements = $(resultElement).find('a');
            for (const aElement of aElements) {
              const text = $(aElement).text().trim();
              if (text.length > 10 && !text.startsWith('http')) {
                title = text;
                url = $(aElement).attr('href') ?? '';
                break;
              }
            }
          }

          if (!title) {
            continue;
          }

          let snippet = '';
          const snippetElements = $(resultElement).find(
            'p.b_lineclamp, p.b_descript, p.b_caption, div.b_lineclamp, div.b_descript, div.b_caption',
          );
          if (snippetElements.length > 0) {
            snippet = snippetElements.first().text().trim();
          }

          if (!snippet) {
            const pElements = $(resultElement).find('p');
            for (const pElement of pElements) {
              const text = $(pElement).text().trim();
              if (text.length > 20) {
                snippet = text;
                break;
              }
            }
          }

          if (!snippet) {
            const allText = $(resultElement).text().trim();
            const sentences = allText.split(/[.!?\n。！]/);
            for (const sentence of sentences) {
              const trimmedSentence = sentence.trim();
              if (trimmedSentence.length > 20 && title !== trimmedSentence) {
                snippet = trimmedSentence;
                break;
              }
            }
          }

          if (url && !url.startsWith('http')) {
            if (url.startsWith('//')) {
              url = `https:${url}`;
            } else if (url.startsWith('/')) {
              url = `https://www.bing.com${url}`;
            }
          }

          searchResults.push(
            SearchResultItem.schema.parse({
              url,
              title,
              snippet,
            }),
          );
        } catch (error) {
          this.logger.warn(error, 'Failed to parse Bing search result');
        }
      }

      let totalResults = 0;
      const countElements = $(
        'span.sb_count, span.b_focusTextMedium, p.sb_count, p.b_focusTextMedium, div.sb_count, div.b_focusTextMedium',
      );
      for (const countElement of countElements) {
        try {
          const text = $(countElement).text().trim();
          const resultCountMatch = text.match(
            /(?:About\s+)?([\d,]+)\s+results?/i,
          );
          const numberStr = resultCountMatch?.[1]?.replace(/,/g, '');
          if (numberStr) {
            totalResults = parseInt(numberStr, 10) || 0;
            break;
          }
        } catch {}
      }

      const finalResult = SearchResults.schema.parse({
        query,
        dataRange,
        totalResults,
        results: searchResults,
      });
      return {
        success: true,
        message: null,
        data: finalResult,
      };
    } catch (error) {
      this.logger.error(error, 'Failed to search Bing');
      const errorResult = SearchResults.schema.parse({
        query,
        dataRange,
        totalResults: 0,
        results: [],
      });
      const errorMessage =
        error instanceof Error && error.name === 'AbortError'
          ? 'Bing search request timeout after 60 seconds'
          : `Bing search failed: ${error instanceof Error ? error.message : String(error)}`;
      return {
        success: false,
        message: errorMessage,
        data: errorResult,
      };
    } finally {
      clearTimeout(timeoutId);
    }
  }
}
