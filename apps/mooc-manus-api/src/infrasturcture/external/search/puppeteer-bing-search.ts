import type { Logger } from '@repo/pino-log';
import * as cheerio from 'cheerio';
import puppeteer, { type Browser } from 'puppeteer';
import type { SearchEngine } from '@/domain/external/search';
import { SearchResultItem, SearchResults } from '@/domain/models/search';
import type { ToolResult } from '@/domain/models/tool-result';
import { getContextLogger } from '@/infrasturcture/logging';

export class PuppeteerBingSearch implements SearchEngine {
  private readonly baseUrl: string = 'https://www.bing.com/search';
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
        past_hour: 'ex1:"ez1"',
        past_day: 'ex1:"ez1"',
        past_week: 'ex1:"ez2"',
        past_month: 'ex1:"ez3"',
        past_year: `ex1:"ez5_${daysSinceEpoch - 365}_${daysSinceEpoch}"`,
      };
      if (dataRange in dateMappings) {
        params.filters = dateMappings[dataRange];
      }
    }

    let browser: Browser | null = null;
    try {
      this.logger.debug('Launching puppeteer browser...');
      browser = await puppeteer.launch({
        headless: false, // Set to false for debugging to see what happens in the browser
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-blink-features=AutomationControlled', // Critical: Hide automation features
          '--no-first-run',
          '--no-zygote',
          '--single-process',
        ],
      });
      const page = await browser.newPage();

      // Set User-Agent and language headers
      await page.setExtraHTTPHeaders({
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      });

      // Set viewport size
      await page.setViewport({ width: 1920, height: 1080 });

      // Further hide automation features
      await page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, 'webdriver', {
          get: () => false,
        });
      });

      // Add setLang=en parameter to force English results
      params.setLang = 'en';
      // Optional: Add cc=US to force US region results, which usually provides better English content
      params.cc = 'US';

      const url = `${this.baseUrl}?${new URLSearchParams(params).toString()}`;
      this.logger.debug(`Navigating to ${url}`);

      // Navigate to page
      await page.goto(url, {
        waitUntil: 'networkidle2', // Wait for network idle
        timeout: 60000, // 60 second timeout
      });

      // Try to wait for search result elements to appear
      // Bing search results are usually contained in id="b_content" or class="b_algo"
      try {
        this.logger.debug('Waiting for search results selector...');
        await page.waitForSelector('#b_content', { timeout: 15000 });
      } catch {
        this.logger.warn(
          'Search results selector (#b_content) not found within timeout',
        );
        // If not found, try taking a screenshot (for local debugging only, remove in production)
        // await page.screenshot({ path: 'bing-debug-error.png' });
      }

      // Get page content
      const html = await page.content();
      this.logger.debug(`Page loaded, HTML length: ${html.length}`);

      // Simple check if content is valid
      if (html.length < 5000) {
        this.logger.warn(
          'HTML content seems too short, might be a block page or captcha.',
        );
        this.logger.debug(`HTML preview: ${html.substring(0, 500)}`);
      }

      const searchResults: SearchResultItem[] = [];
      const $ = cheerio.load(html);
      const resultElements = $('li.b_algo');

      this.logger.debug(`Found ${resultElements.length} result elements`);

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
          this.logger.warn(error, 'Failed to parse Bing search result item');
        }
      }

      let totalResults = 0;
      // Find elements matching format: "About 34,800,000 results"
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

      return {
        success: true,
        message: null,
        data: SearchResults.schema.parse({
          query,
          dataRange,
          totalResults,
          results: searchResults,
        }),
      };
    } catch (error) {
      this.logger.error(error, 'Failed to search Bing with Puppeteer');
      const errorResult = SearchResults.schema.parse({
        query,
        dataRange,
        totalResults: 0,
        results: [],
      });
      return {
        success: false,
        message: `Bing search failed: ${error instanceof Error ? error.message : String(error)}`,
        data: errorResult,
      };
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }
}
