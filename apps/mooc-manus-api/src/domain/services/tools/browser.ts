import type { Browser } from '@/domain/external/browser';
import { createTool, createToolCollection } from './base';

export const createBrowserToolCollection = (browser: Browser) => {
  const browserToolCollection = createToolCollection('browser_tools');

  const browserViewTool = createTool(
    browser.viewPage,
    'browser_view',
    'View the current browser page content to confirm the latest state of the opened page.',
    {},
    [],
  );

  const browserNavigateTool = createTool(
    (params: { url: string }) => browser.navigate(params.url),
    'browser_navigate',
    'Navigate the browser to the specified URL when you need to access a new page.',
    {
      url: {
        type: 'string',
        description:
          'The URL to navigate to, must contain the protocol prefix. (e.g., https://www.google.com)',
      },
    },
    ['url'],
  );

  const browserRestartTool = createTool(
    (params: { url: string }) => browser.restart(params.url),
    'browser_restart',
    'Restart the browser and navigate to the specified URL, use when you need to reset the browser.',
    {
      url: {
        type: 'string',
        description:
          'The URL to navigate to, must contain the protocol prefix. (e.g., https://www.google.com)',
      },
    },
    ['url'],
  );

  const browserClick = (params: { index?: number; x?: number; y?: number }) => {
    if (params.index !== undefined && params.index !== null) {
      return browser.click(params.index);
    }
    if (
      params.x !== undefined &&
      params.x !== null &&
      params.y !== undefined &&
      params.y !== null
    ) {
      return browser.click({ x: params.x, y: params.y });
    }
    throw new Error('Either index or x and y must be provided');
  };

  const browserClickTool = createTool(
    browserClick,
    'browser_click',
    'Click the specified index of the current browser page, use when you need to click on a page element.',
    {
      index: {
        type: 'integer',
        description:
          '(Optional) The index of the element to click, start from 0',
      },
      x: {
        type: 'number',
        description: '(Optional) The x coordinate of the element to click',
      },
      y: {
        type: 'number',
        description: '(Optional) The y coordinate of the element to click',
      },
    },
    [],
  );

  const browserInput = (params: {
    text: string;
    pressEnter: boolean;
    index?: number;
    x?: number;
    y?: number;
  }) => {
    if (params.index !== undefined && params.index !== null) {
      return browser.input(params.text, params.pressEnter, params.index);
    }
    if (
      params.x !== undefined &&
      params.x !== null &&
      params.y !== undefined &&
      params.y !== null
    ) {
      return browser.input(params.text, params.pressEnter, {
        x: params.x,
        y: params.y,
      });
    }
    throw new Error('Either index or x and y must be provided');
  };

  const browserInputTool = createTool(
    browserInput,
    'browser_input',
    'Overwrite the text in editable areas (input, textarea) of the current browser page, used when you need to fill in input fields.',
    {
      text: {
        type: 'string',
        description: 'The complete text content to fill into the input field',
      },
      pressEnter: {
        type: 'boolean',
        description: 'Whether to press Enter after filling the input field',
      },
      index: {
        type: 'integer',
        description:
          '(Optional) The index of the element to input, start from 0',
      },
      x: {
        type: 'number',
        description: '(Optional) The x coordinate of the element to input',
      },
      y: {
        type: 'number',
        description: '(Optional) The y coordinate of the element to input',
      },
    },
    ['text', 'pressEnter'],
  );

  const browserMoveMouseTool = createTool(
    (params: { x: number; y: number }) =>
      browser.moveMouse({ x: params.x, y: params.y }),
    'browser_move_mouse',
    'Move the mouse cursor to the specified position on the current browser page, used to simulate user mouse movement.',
    {
      x: {
        type: 'number',
        description: 'The x coordinate to move the mouse cursor to',
      },
      y: {
        type: 'number',
        description: 'The y coordinate to move the mouse cursor to',
      },
    },
    ['x', 'y'],
  );

  const browserPressKeyTool = createTool(
    (params: { key: string }) => browser.pressKey(params.key),
    'browser_press_key',
    'Simulate keyboard input on the current browser page, use when you need to perform specific keyboard operations.',
    {
      key: {
        type: 'string',
        description:
          'The name of the key to simulate (e.g., Enter, Tab, ArrowUp), supports combination keys (e.g., Control+Enter)',
      },
    },
    ['key'],
  );

  const browserSelectOptionTool = createTool(
    (params: { index: number; option: number }) =>
      browser.selectOption(params.index, params.option),
    'browser_select_option',
    'Select the specified option from the dropdown list element on the current browser page, used to select options from dropdown menus.',
    {
      index: {
        type: 'integer',
        description:
          'The index of the dropdown list element to operate (starting from 0)',
      },
      option: {
        type: 'integer',
        description:
          'The index of the option to select (starting from 0, referring to the item in the dropdown list)',
      },
    },
    ['index', 'option'],
  );

  const browserScrollUpTool = createTool(
    (params: { toTop?: boolean }) => browser.scrollUp(params.toTop),
    'browser_scroll_up',
    'Scroll the current browser page up, used to view content above or return to the top of the browser.',
    {
      toTop: {
        type: 'boolean',
        description:
          '(Optional) Whether to scroll directly to the top of the page, rather than scrolling up one screen',
      },
    },
    [],
  );

  const browserScrollDownTool = createTool(
    (params: { toBottom?: boolean }) => browser.scrollDown(params.toBottom),
    'browser_scroll_down',
    'Scroll the current browser page down, used to view content below or return to the bottom of the browser.',
    {
      toBottom: {
        type: 'boolean',
        description:
          '(Optional) Whether to scroll directly to the bottom of the page, rather than scrolling down one screen',
      },
    },
    [],
  );

  const browserConsoleExecTool = createTool(
    (params: { javascript: string }) => browser.consoleExec(params.javascript),
    'browser_console_exec',
    'Execute JavaScript code in the browser console, used when you need to execute custom scripts.',
    {
      javascript: {
        type: 'string',
        description: 'The JavaScript code to execute in the browser console',
      },
    },
    ['javascript'],
  );

  const browserConsoleViewTool = createTool(
    (params: { maxLines?: number }) => browser.consoleView(params.maxLines),
    'browser_console_view',
    'View the console output of the current browser page, used to check JavaScript logs or debug page errors.',
    {
      maxLines: {
        type: 'integer',
        description: '(Optional) The maximum number of lines of log to return',
      },
    },
    [],
  );

  browserToolCollection.registerTool(browserViewTool);
  browserToolCollection.registerTool(browserNavigateTool);
  browserToolCollection.registerTool(browserRestartTool);
  browserToolCollection.registerTool(browserClickTool);
  browserToolCollection.registerTool(browserInputTool);
  browserToolCollection.registerTool(browserMoveMouseTool);
  browserToolCollection.registerTool(browserPressKeyTool);
  browserToolCollection.registerTool(browserSelectOptionTool);
  browserToolCollection.registerTool(browserScrollUpTool);
  browserToolCollection.registerTool(browserScrollDownTool);
  browserToolCollection.registerTool(browserConsoleExecTool);
  browserToolCollection.registerTool(browserConsoleViewTool);

  return browserToolCollection;
};
