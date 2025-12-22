import type { Browser } from '@/domain/external/browser';
import { ToolCollection, tool } from './base';

export class BrowserToolCollection extends ToolCollection {
  constructor(private readonly browser: Browser) {
    super('browser_tools');
  }

  @tool({
    name: 'browser_view',
    description:
      'View the current browser page content to confirm the latest state of the opened page.',
    parameters: {},
    required: [],
  })
  async browserView() {
    return this.browser.viewPage();
  }

  @tool({
    name: 'browser_navigate',
    description:
      'Navigate the browser to the specified URL when you need to access a new page.',
    parameters: {
      url: {
        type: 'string',
        description:
          'The URL to navigate to, must contain the protocol prefix. (e.g., https://www.google.com)',
      },
    },
    required: ['url'],
  })
  async browserNavigate(params: { url: string }) {
    return this.browser.navigate(params.url);
  }

  @tool({
    name: 'browser_restart',
    description:
      'Restart the browser and navigate to the specified URL, use when you need to reset the browser.',
    parameters: {
      url: {
        type: 'string',
        description:
          'The URL to navigate to, must contain the protocol prefix. (e.g., https://www.google.com)',
      },
    },
    required: ['url'],
  })
  async browserRestart(params: { url: string }) {
    return this.browser.restart(params.url);
  }

  @tool({
    name: 'browser_click',
    description:
      'Click the specified index of the current browser page, use when you need to click on a page element.',
    parameters: {
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
    required: [],
  })
  async browserClick(params: { index?: number; x?: number; y?: number }) {
    if (params.index !== undefined && params.index !== null) {
      return this.browser.click(params.index);
    }
    if (
      params.x !== undefined &&
      params.x !== null &&
      params.y !== undefined &&
      params.y !== null
    ) {
      return this.browser.click({ x: params.x, y: params.y });
    }
    throw new Error('Either index or x and y must be provided');
  }

  @tool({
    name: 'browser_input',
    description:
      'Overwrite the text in editable areas (input, textarea) of the current browser page, used when you need to fill in input fields.',
    parameters: {
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
    required: ['text', 'pressEnter'],
  })
  async browserInput(params: {
    text: string;
    pressEnter: boolean;
    index?: number;
    x?: number;
    y?: number;
  }) {
    if (params.index !== undefined && params.index !== null) {
      return this.browser.input(params.text, params.pressEnter, params.index);
    }
    if (
      params.x !== undefined &&
      params.x !== null &&
      params.y !== undefined &&
      params.y !== null
    ) {
      return this.browser.input(params.text, params.pressEnter, {
        x: params.x,
        y: params.y,
      });
    }
    throw new Error('Either index or x and y must be provided');
  }

  @tool({
    name: 'browser_move_mouse',
    description:
      'Move the mouse cursor to the specified position on the current browser page, used to simulate user mouse movement.',
    parameters: {
      x: {
        type: 'number',
        description: 'The x coordinate to move the mouse cursor to',
      },
      y: {
        type: 'number',
        description: 'The y coordinate to move the mouse cursor to',
      },
    },
    required: ['x', 'y'],
  })
  async browserMoveMouse(params: { x: number; y: number }) {
    return this.browser.moveMouse({ x: params.x, y: params.y });
  }

  @tool({
    name: 'browser_press_key',
    description:
      'Simulate keyboard input on the current browser page, use when you need to perform specific keyboard operations.',
    parameters: {
      key: {
        type: 'string',
        description:
          'The name of the key to simulate (e.g., Enter, Tab, ArrowUp), supports combination keys (e.g., Control+Enter)',
      },
    },
    required: ['key'],
  })
  async browserPressKey(params: { key: string }) {
    return this.browser.pressKey(params.key);
  }

  @tool({
    name: 'browser_select_option',
    description:
      'Select the specified option from the dropdown list element on the current browser page, used to select options from dropdown menus.',
    parameters: {
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
    required: ['index', 'option'],
  })
  async browserSelectOption(params: { index: number; option: number }) {
    return this.browser.selectOption(params.index, params.option);
  }

  @tool({
    name: 'browser_scroll_up',
    description:
      'Scroll the current browser page up, used to view content above or return to the top of the browser.',
    parameters: {
      toTop: {
        type: 'boolean',
        description:
          '(Optional) Whether to scroll directly to the top of the page, rather than scrolling up one screen',
      },
    },
    required: [],
  })
  async browserScrollUp(params: { toTop?: boolean }) {
    return this.browser.scrollUp(params.toTop);
  }

  @tool({
    name: 'browser_scroll_down',
    description:
      'Scroll the current browser page down, used to view content below or return to the bottom of the browser.',
    parameters: {
      toBottom: {
        type: 'boolean',
        description:
          '(Optional) Whether to scroll directly to the bottom of the page, rather than scrolling down one screen',
      },
    },
    required: [],
  })
  async browserScrollDown(params: { toBottom?: boolean }) {
    return this.browser.scrollDown(params.toBottom);
  }

  @tool({
    name: 'browser_console_exec',
    description:
      'Execute JavaScript code in the browser console, used when you need to execute custom scripts.',
    parameters: {
      javascript: {
        type: 'string',
        description: 'The JavaScript code to execute in the browser console',
      },
    },
    required: ['javascript'],
  })
  async browserConsoleExec(params: { javascript: string }) {
    return this.browser.consoleExec(params.javascript);
  }

  @tool({
    name: 'browser_console_view',
    description:
      'View the console output of the current browser page, used to check JavaScript logs or debug page errors.',
    parameters: {
      maxLines: {
        type: 'integer',
        description: '(Optional) The maximum number of lines of log to return',
      },
    },
    required: [],
  })
  async browserConsoleView(params: { maxLines?: number }) {
    return this.browser.consoleView(params.maxLines);
  }
}
