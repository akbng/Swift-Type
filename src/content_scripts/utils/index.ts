import type * as CSS from 'csstype';

export function checkElement(selector: string) {
  return document.querySelector(selector) !== null;
}

export function getElement(selector: string) {
  return document.querySelector<HTMLElement>(selector);
}

export function applyStyle(element: HTMLElement, styles: CSS.Properties) {
  Object.assign(element.style, styles);
}

export function findCursorPos(): [number, number] {
  const selection = window.getSelection();
  if (!selection?.focusNode || !selection.rangeCount) return [0, 0];
  const clientRect = selection.getRangeAt(0).getClientRects();
  if (clientRect.length === 0) return [0, 0];
  const { x, bottom } = clientRect[0];
  return [x, window.innerHeight - bottom];
}

export function writeOnContentEditableDiv(
  div: HTMLElement | null,
  text: string
) {
  if (!div) return;
  div.focus();
  // This is not proper but gets the job done
  document.execCommand('insertText', false, text);
}

export function waitForElement(selector: string): Promise<Element> {
  return new Promise((resolve) => {
    const element = getElement(selector);
    if (element) resolve(element);

    const observer = new MutationObserver((_, observer) => {
      const element = getElement(selector);
      if (element) {
        observer.disconnect();
        resolve(element);
      }
    });

    observer.observe(document.body, {
      childList: true,
      attributes: true,
      subtree: true,
    });
  });
}

// the observer never disconnects
export function watchTarget(target: string, cl: MutationCallback) {
  const observer = new MutationObserver(cl);
  const targetNode = getElement(target);
  if (targetNode)
    observer.observe(targetNode, {
      childList: true,
      attributes: true,
      subtree: true,
    });
}
