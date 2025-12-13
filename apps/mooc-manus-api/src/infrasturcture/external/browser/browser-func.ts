export const getVisibleContent = () => {
  const visibleElements = [];
  const viewportHeight = window.innerHeight;
  const viewportWidth = window.innerWidth;

  const elements = document.querySelectorAll('body *');
  for (const element of elements) {
    const htmlElement = element as HTMLElement;
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

  return `<div>${visibleElements.join(' ')}</div>`;
};
