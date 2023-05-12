import type * as CSS from 'csstype';
import {
  applyStyle,
  findCursorPos,
  getElement,
  watchTarget,
  writeOnContentEditableDiv,
} from './utils';
import { OpenAIEditResponeType, autoCompleteWithGPT } from './utils/openai';
import defaultData, { ShortcutName, storedType } from '../shared/defaults';

const msgBoxSelector = "#main div[role='textbox']";
const textSelector = "#app [data-lexical-text='true']";
let controller: AbortController;
let suggestionElement: HTMLElement;
let suggestions: string[] = [];
let currentSuggestion = '';
const storedData = Object.assign({}, defaultData);
let observer: MutationObserver;

async function init() {
  const callback = (_: MutationRecord[], obs: MutationObserver) => {
    observer = obs;
    const msgBox = getElement(msgBoxSelector);
    if (msgBox && !storedData.manual_complete) {
      msgBox.removeEventListener('input', handleInput, false);
      msgBox.addEventListener('input', handleInput, false);
    }

    if (suggestionElement) updatePlacholderMessage(suggestionElement, '');
  };

  const data = await chrome.storage.local.get();
  Object.assign(storedData, data);
  console.log(storedData);
  watchTarget('#app', callback);
  window.removeEventListener('keydown', handleKeyDown as EventListener, false);
  window.addEventListener('keydown', handleKeyDown as EventListener, false);
}

init();

function handleInput() {
  const textElement = document.querySelector(textSelector);
  const text = textElement?.innerHTML ?? '';
  if (!textElement && !text) return;

  triggerSuggestion(text);
}

async function triggerSuggestion(msg: string) {
  try {
    if (controller) controller.abort();
    controller = new AbortController();

    const response = await autoCompleteWithGPT(
      storedData.apikey,
      Number(storedData.num_suggest),
      msg,
      controller.signal
    );
    const data: OpenAIEditResponeType = await response.json();
    const choices = data.choices;
    if (choices?.length)
      suggestions = choices.map((choice) =>
        choice.text.substring(msg.trim().length)
      );
    console.log(suggestions, data.choices);
    currentSuggestion = suggestions[0] ?? '';
    if (!suggestionElement)
      suggestionElement = showPlaceholderMessage(currentSuggestion);
    else updatePlacholderMessage(suggestionElement, currentSuggestion);
  } catch (error: unknown) {
    if (error instanceof DOMException) console.log(error.message);
    else console.error(error);
  }
}

function handleKeyDown(e: KeyboardEvent) {
  interface actionInterface {
    [key: string]: () => void;
  }
  const actionToDo: actionInterface = {
    cycle: cycleThroughSuggestions,
    trigger: handleInput,
    accept: acceptSuggestion,
  };

  Object.keys(defaultData.shortcuts).forEach((action) => {
    const shortcut =
      storedData?.shortcuts[action as ShortcutName] ||
      defaultData.shortcuts[action as ShortcutName];
    if (
      e.key === shortcut.key &&
      e.altKey === shortcut.altKey &&
      e.ctrlKey === shortcut.ctrlKey &&
      e.shiftKey === shortcut.shiftKey
    ) {
      e.preventDefault();
      actionToDo[action as keyof actionInterface]();
    }
  });
}

function cycleThroughSuggestions(move = 1) {
  if (!suggestions.length) return;
  const currentIndex = suggestions.indexOf(currentSuggestion);
  const newIndex =
    (currentIndex + move + suggestions.length) % suggestions.length;
  currentSuggestion = suggestions[newIndex];
  updatePlacholderMessage(suggestionElement, currentSuggestion);
}

function showPlaceholderMessage(text: string): HTMLElement {
  const [x, y] = findCursorPos();
  const body = document.body;
  const pElement = document.createElement('p');
  pElement.innerHTML = text;
  body.appendChild(pElement);

  const styles: CSS.Properties = {
    position: 'absolute',
    bottom: `${y}px`,
    left: `${x}px`,
    zIndex: '1000',
    color: body.classList.contains('dark') ? '#6b7280' : '#374151',
  };
  applyStyle(pElement, styles);
  return pElement;
}

function acceptSuggestion() {
  if (!suggestions.length) return;
  const msgBox = getElement(msgBoxSelector);
  msgBox?.removeEventListener('input', handleInput, false);
  writeOnContentEditableDiv(msgBox, currentSuggestion);
  suggestions = [];
  currentSuggestion = '';
  updatePlacholderMessage(suggestionElement, currentSuggestion);
  if (!storedData.manual_complete)
    msgBox?.addEventListener('input', handleInput, false);
}

function updatePlacholderMessage(element: HTMLElement, newText: string) {
  const [x, y] = findCursorPos();
  const updatedStyles: CSS.Properties = {
    bottom: `${y}px`,
    left: `${x}px`,
  };
  element.innerHTML = newText;
  applyStyle(element, updatedStyles);
}

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace !== 'local') return;
  for (const [key, { oldValue, newValue }] of Object.entries(changes)) {
    (storedData[key as keyof storedType] as unknown) = newValue;
    observer?.disconnect();
    init();
    console.log(
      `Storage key "${key}" changed.\n
      Old value was "${oldValue}", new value is "${newValue}".`
    );
  }
});
