import type { Logger } from '@repo/pino-log';
import {
  type Browser,
  type BrowserContext,
  chromium,
  type Locator,
  type Page,
} from 'playwright';
import TurndownService from 'turndown';
import type {
  Browser as BrowserInterface,
  Position,
} from '@/domain/external/browser';
import type { LlmClient } from '@/domain/external/llm';
import { getContextLogger } from '@/infrasturcture/logging';
import {
  getInteractiveElements,
  getVisibleContent,
  injectConsoleLogs,
} from './browser-func';

type InteractiveElement = {
  index: number;
  tag: string;
  text: string;
  selector: string;
};

export class PlaywrightBrowser implements BrowserInterface {
  private readonly logger: Logger;
  private readonly cdpUrl: string;
  private readonly llm: LlmClient | null = null;
  private browser: Browser | null = null;
  private page: Page | null = null;
  private interactiveElementsCache: InteractiveElement[] = [];

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

  private getElementByIndex(index: number): Locator | null {
    if (
      this.interactiveElementsCache.length === 0 ||
      index >= this.interactiveElementsCache.length
    ) {
      return null;
    }
    if (!this.page) {
      return null;
    }

    const selector = `[data-manus-id="manus-element-${index}"]`;
    const element = this.page.locator(selector).first();
    return element;
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
    await this.ensurePage();
    if (!this.page) {
      throw new Error('Page not initialized');
    }
    const visibleContent = (await this.page.evaluate(
      getVisibleContent,
    )) as string;

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

  private async extractInteractiveElements(): Promise<string[]> {
    await this.ensurePage();
    if (!this.page) {
      throw new Error('Page not initialized');
    }

    this.interactiveElementsCache = [];
    const interactiveElements = (await this.page.evaluate(
      getInteractiveElements,
    )) as Array<{
      index: number;
      tag: string;
      text: string;
      selector: string;
    }>;

    this.interactiveElementsCache = interactiveElements;

    const formattedElements: string[] = [];
    for (const element of interactiveElements) {
      formattedElements.push(
        `${element.index}:<${element.tag}>${element.text}</${element.tag}>`,
      );
    }

    return formattedElements;
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
      this.interactiveElementsCache = [];
      this.page = null;
      this.browser = null;
    }
  }

  async navigate(url: string) {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      this.interactiveElementsCache = [];
      await this.page.goto(url);
      const interactiveElements = await this.extractInteractiveElements();

      return {
        success: true,
        message: null,
        data: {
          interactiveElements,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to navigate to ${url}: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async viewPage() {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      await this.waitForPageLoad();

      const [interactiveElements, content] = await Promise.all([
        this.extractInteractiveElements(),
        this.extractContent(),
      ]);

      return {
        success: true,
        data: {
          interactiveElements,
          content,
        },
        message: null,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to view page: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async restart(url: string) {
    await this.cleanup();
    return this.navigate(url);
  }

  async scrollUp(toTop: boolean = false) {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      if (toTop) {
        await this.page.evaluate('window.scrollTo(0, 0)');
      } else {
        await this.page.evaluate('window.scrollBy(0, -window.innerHeight)');
      }

      return {
        success: true,
        message: null,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to scroll up: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async scrollDown(toBottom: boolean = false) {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      if (toBottom) {
        await this.page.evaluate(
          'window.scrollTo(0, document.body.scrollHeight)',
        );
      } else {
        await this.page.evaluate('window.scrollBy(0, window.innerHeight)');
      }

      return {
        success: true,
        message: null,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to scroll down: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async screenshot(fullPage: boolean = false) {
    await this.ensurePage();

    if (!this.page) {
      throw new Error('Page not initialized');
    }

    const screenshot = await this.page.screenshot({
      fullPage,
      type: 'png',
    });

    return screenshot;
  }

  async consoleExec(javascript: string) {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      await this.page.evaluate(injectConsoleLogs);
      const result = await this.page.evaluate(javascript);

      return {
        success: true,
        message: null,
        data: result,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to execute JavaScript: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async consoleView(maxLines?: number) {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      let logs = (await this.page.evaluate(
        '() => window.console.logs || []',
      )) as Array<string>;

      if (maxLines) {
        logs = logs.slice(-maxLines);
      }

      return {
        success: true,
        message: null,
        data: logs,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to execute JavaScript: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async click(data: number | Position) {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      if (typeof data === 'number') {
        const element = this.getElementByIndex(data);
        if (!element) {
          throw new Error(`Element with index ${data} not found`);
        }

        // const isVisible = await this.page.evaluate(
        //   `(element) => {
        //     if (!element) {
        //       return false;
        //     }
        //     const rect = element.getBoundingClientRect();
        //     const style = window.getComputedStyle(element);
        //     return !(rect.width === 0 || rect.height === 0 || style.display === 'none' || style.visibility === 'hidden' || style.opacity === '0');
        //   }`,
        //   element,
        // );
        const isVisible = await element.isVisible();

        if (!isVisible) {
          element.scrollIntoViewIfNeeded();
          // await this.page.evaluate(
          //   `(element) => {
          //     if (element) {
          //       element.scrollIntoView({
          //         behavior: 'smooth',
          //         block: 'center',
          //       });
          //     }
          //   }`,
          //   element,
          // );

          // await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        await element.click({
          timeout: 5000,
        });
      } else if (
        typeof data === 'object' &&
        data !== null &&
        'x' in data &&
        'y' in data
      ) {
        await this.page.mouse.click(data.x, data.y);
      } else {
        throw new Error('Invalid data type for click');
      }

      return {
        success: true,
        message: null,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to click ${JSON.stringify(data)}: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async input(text: string, pressEnter: boolean, data: number | Position) {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      if (typeof data === 'number') {
        const element = this.getElementByIndex(data);
        if (!element) {
          throw new Error(`Element with index ${data} not found`);
        }

        try {
          await element.fill(text);
        } catch {
          await element.click();
          await element.fill(text);
        }
      } else if (
        typeof data === 'object' &&
        data !== null &&
        'x' in data &&
        'y' in data
      ) {
        await this.page.mouse.click(data.x, data.y);
        await this.page.keyboard.type(text);
      } else {
        throw new Error('Invalid data type for input');
      }

      if (pressEnter) {
        await this.page.keyboard.press('Enter');
      }

      return {
        success: true,
        message: null,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to input ${text} ${pressEnter ? 'with Enter' : ''} ${JSON.stringify(data)}: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async moveMouse(position: Position) {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      await this.page.mouse.move(position.x, position.y);

      return {
        success: true,
        message: null,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to move mouse to ${JSON.stringify(position)}: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async pressKey(key: string) {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      await this.page.keyboard.press(key);

      return {
        success: true,
        message: null,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to press key ${key}: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }

  async selectOption(index: number, option: number) {
    await this.ensurePage();

    try {
      if (!this.page) {
        throw new Error('Page not initialized');
      }

      const element = this.getElementByIndex(index);
      if (!element) {
        throw new Error(`Element with index ${index} not found`);
      }

      await element.selectOption({
        index: option,
      });

      return {
        success: true,
        message: null,
        data: null,
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to select option ${index} ${option}: ${error instanceof Error ? error.message : String(error)}`,
        data: null,
      };
    }
  }
}
