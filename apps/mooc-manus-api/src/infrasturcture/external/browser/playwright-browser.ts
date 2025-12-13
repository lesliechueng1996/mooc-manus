import type { Logger } from '@repo/pino-log';
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Page,
} from 'playwright';
import TurndownService from 'turndown';
import type { Browser as BrowserInterface } from '@/domain/external/browser';
import type { LlmClient } from '@/domain/external/llm';
import { getContextLogger } from '@/infrasturcture/logging';
import { getVisibleContent } from './browser-func';

export class PlaywrightBrowser implements BrowserInterface {
  private readonly logger: Logger;
  private readonly cdpUrl: string;
  private readonly llm: LlmClient | null = null;
  private browser: Browser | null = null;
  private page: Page | null = null;

  constructor(cdpUrl: string, llm: LlmClient | null = null) {
    this.logger = getContextLogger();
    this.cdpUrl = cdpUrl;
    this.llm = llm;
  }

  private async ensureBrowser() {
    if (!this.browser || !this.page) {
      const result = await this.initialize();
      if (!result) {
        throw new Error('Failed to initialize Playwright Browser');
      }
    }
  }

  private async ensurePage() {
    await this.ensureBrowser();
    if (!this.browser) {
      throw new Error('Browser not initialized');
    }
    if (!this.page) {
      this.page = await this.browser.newPage();
    } else {
      const contexts = this.browser.contexts();
      if (contexts.length > 0) {
        const defaultContext = contexts[0];
        const pages = defaultContext.pages();
        if (pages.length > 0) {
          const latestPage = pages[pages.length - 1];
          if (this.page !== latestPage) {
            this.page = latestPage;
          }
        }
      }
    }
  }

  private async waitForPageLoad(timeout: number = 15): Promise<boolean> {
    await this.ensurePage();
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const startTime = Date.now();
    const checkInterval = 5;
    while (Date.now() - startTime < timeout * 1000) {
      const isCompleted = (await this.page.evaluate(
        '() => document.readyState === "complete"',
      )) as boolean;
      if (isCompleted) {
        return true;
      }
      await new Promise((resolve) => setTimeout(resolve, checkInterval * 1000));
    }

    return false;
  }

  private async extractContent(): Promise<string> {
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    const visibleContent = await this.page.evaluate(getVisibleContent);

    const turndownService = new TurndownService();
    const markdownContent = turndownService.turndown(visibleContent);
    const maxContentLength = Math.min(markdownContent.length, 50000);

    if (this.llm) {
      const response = await this.llm.invoke({
        messages: [
          {
            role: 'system',
            content:
              'You are a professional web page information extraction assistant, please extract all information from the current page content and convert it to markdown format',
          },
          {
            role: 'user',
            content: markdownContent.substring(0, maxContentLength),
          },
        ],
      });

      return (response.content as string) || '';
    }

    return markdownContent.substring(0, maxContentLength);
  }

  async initialize(): Promise<boolean> {
    const maxRetries = 5;
    let retryInterval = 1;

    for (let i = 0; i < maxRetries; i++) {
      try {
        this.browser = await chromium.connectOverCDP(this.cdpUrl);

        const contexts = this.browser.contexts();
        if (contexts.length > 0 && contexts[0].pages().length === 1) {
          const page = contexts[0].pages()[0];
          const url = page.url();
          if (
            url === 'about:blank' ||
            url === 'chrome://newtab/' ||
            url === 'chrome://new-tab-page/' ||
            !url
          ) {
            this.page = page;
          } else {
            this.page = await contexts[0].newPage();
          }
        } else {
          let context: BrowserContext | undefined;
          if (contexts.length === 0) {
            context = await this.browser.newContext();
          } else {
            context = contexts[0];
          }

          this.page = await context.newPage();
        }
        return true;
      } catch (error) {
        await this.cleanup();
        if (i === maxRetries - 1) {
          this.logger.error(
            error,
            `Failed to initialize Playwright Browser, already retry ${i + 1} times`,
          );
          return false;
        }
        retryInterval = Math.min(retryInterval * 2, 10);
        this.logger.warn(
          error,
          `Failed to initialize Playwright Browser, retrying in ${i + 1} times, ${retryInterval} seconds...`,
        );
        await new Promise((resolve) =>
          setTimeout(resolve, retryInterval * 1000),
        );
      }
    }
    return false;
  }

  async cleanup() {
    try {
      if (this.browser) {
        const contexts = this.browser.contexts();
        for (const context of contexts) {
          const pages = context.pages();
          for (const page of pages) {
            if (!page.isClosed()) {
              await page.close();
            }
          }
          await context.close();
        }
      }

      if (this.page && !this.page.isClosed()) {
        await this.page.close();
      }

      if (this.browser) {
        await this.browser.close();
      }
    } catch (error) {
      this.logger.error(error, 'Failed to cleanup Playwright Browser');
    } finally {
      this.page = null;
      this.browser = null;
    }
  }
}
