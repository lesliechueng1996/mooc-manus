export const getVisibleContent = `
  (() => {
    const visibleElements = [];
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const elements = document.querySelectorAll('body *');
    for (const element of elements) {
      const htmlElement = element;
      const rect = htmlElement.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        continue;
      }

      if (
        rect.bottom < 0 ||
        rect.right < 0 ||
        rect.top > viewportHeight ||
        rect.left > viewportWidth
      ) {
        continue;
      }

      const style = window.getComputedStyle(htmlElement);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        continue;
      }

      if (
        htmlElement.innerText ||
        htmlElement.tagName === 'IMG' ||
        htmlElement.tagName === 'INPUT' ||
        htmlElement.tagName === 'BUTTON'
      ) {
        visibleElements.push(htmlElement.outerHTML);
      }
    }

    return \`<div>\${visibleElements.join(' ')}</div>\`;
  })();
`;

export const getInteractiveElements = `
  (() => {
    const interactiveElements = [];
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;

    const elements = document.querySelectorAll(
      'button, a, input, textarea, select, [role="button"], [tabindex]:not([tabindex="-1"])',
    );

    let validElementIndex = 0;

    for (const element of elements) {
      const htmlElement = element;
      const rect = htmlElement.getBoundingClientRect();

      if (rect.width === 0 || rect.height === 0) {
        continue;
      }

      if (
        rect.bottom < 0 ||
        rect.right < 0 ||
        rect.top > viewportHeight ||
        rect.left > viewportWidth
      ) {
        continue;
      }

      const style = window.getComputedStyle(htmlElement);
      if (
        style.display === 'none' ||
        style.visibility === 'hidden' ||
        style.opacity === '0'
      ) {
        continue;
      }

      const tagName = htmlElement.tagName.toLowerCase();
      let text = '';

      if (
        'value' in htmlElement &&
        ['input', 'textarea', 'select'].includes(tagName) &&
        htmlElement.value
      ) {
        text = htmlElement.value;

        if (tagName === 'input') {
          const inputElement = htmlElement;

          let labelText = '';
          if (inputElement.id) {
            const labelElement = document.querySelector(
              \`label[for="\${inputElement.id}"]\`,
            );
            if (labelElement) {
              labelText = labelElement.innerText.trim();
            }
          }

          if (!labelText) {
            const parentLabel = inputElement.closest('label');
            if (parentLabel) {
              labelText = parentLabel.innerText
                .trim()
                .replace(inputElement.value, '')
                .trim();
            }
          }

          if (labelText) {
            text = \`[Label: \${labelText}] \${text}\`;
          }

          if (inputElement.placeholder) {
            text = \`\${text} [Placeholder: \${inputElement.placeholder}]\`;
          }
        }
      } else if (htmlElement.innerText) {
        text = htmlElement.innerText.trim().replace(/\\s+/g, ' ');
      } else if ('alt' in htmlElement && htmlElement.alt) {
        text = htmlElement.alt;
      } else if (htmlElement.title) {
        text = htmlElement.title;
      } else if ('placeholder' in htmlElement && htmlElement.placeholder) {
        text = \`[Placeholder: \${htmlElement.placeholder}]\`;
      } else if ('type' in htmlElement && htmlElement.type) {
        text = \`[Type: \${htmlElement.type}]\`;

        if (tagName === 'input') {
          const inputElement = htmlElement;

          let labelText = '';
          if (inputElement.id) {
            const labelElement = document.querySelector(
              \`label[for="\${inputElement.id}"]\`,
            );
            if (labelElement) {
              labelText = labelElement.innerText.trim();
            }
          }

          if (!labelText) {
            const parentLabel = inputElement.closest('label');
            if (parentLabel) {
              labelText = parentLabel.innerText
                .trim()
                .replace(inputElement.value, '')
                .trim();
            }
          }

          if (labelText) {
            text = \`[Label: \${labelText}] \${text}\`;
          }

          if (inputElement.placeholder) {
            text = \`\${text} [Placeholder: \${inputElement.placeholder}]\`;
          }
        }
      } else {
        text = '[No text]';
      }

      if (text.length > 100) {
        text = \`\${text.substring(0, 97)}...\`;
      }

      htmlElement.setAttribute(
        'data-manus-id',
        \`manus-element-\${validElementIndex}\`,
      );
      const selector = \`[data-manus-id="manus-element-\${validElementIndex}"]\`;

      interactiveElements.push({
        index: validElementIndex,
        tag: tagName,
        text,
        selector,
      });

      validElementIndex++;
    }

    return interactiveElements;
  })();
`;

export const injectConsoleLogs = `
  (() => {
    window.console.logs = [];
    const originalConsoleLog = console.log;
    console.log = (...args) => {
      window.console.logs.push(args.join(' '));
      originalConsoleLog.apply(console, args);
    }
  })();
`;
