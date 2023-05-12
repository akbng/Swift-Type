import { replace } from 'feather-icons';

const saveButton = document.querySelector('.save-button');
const resetButton = document.querySelector('.reset-button');
const revealButton = document.querySelector('.reveal-button');
const copyButton = document.querySelector('.copy-button');
const apiKey = document.querySelector('.apikey > input');
const editKey = document.querySelector('.edit-button');
const temperatureRange = document.querySelector('#temperature');
const nSuggestInput = document.querySelector('#nSuggestion');
const manualComplete = document.querySelector('#manual_complete');
const messageElement = document.querySelector('.message');
const copyWrapper = document.querySelector('.copy');
const modal = document.querySelector('dialog.modal');
const modalCancelButton = document.querySelector('.modal-cancel');
const keyboardShortcutDialog = document.querySelector('.keyboard-modal');
const modalHeading = document.querySelector('.modal-header > h2');
const newKeybinding = document.querySelector('.keybindings-shorthand');
const changeShortcutBtn = document.querySelector('.retry-button');
const saveShortcutBtn = document.querySelector('.modal-save');
const keybindingsShorthands = document.querySelectorAll(
  '.keybindings-shorthands'
);

const defaultData = {
  apikey: '',
  manual_complete: false,
  num_suggest: '1',
  temperature: '1',
  shortcuts: {
    cycle: {
      ctrlKey: false,
      altKey: true,
      shiftKey: false,
      key: '.',
    },
    trigger: {
      ctrlKey: false,
      altKey: true,
      shiftKey: false,
      key: 'm',
    },
    accept: {
      ctrlKey: false,
      altKey: false,
      shiftKey: false,
      key: 'Tab',
    },
  },
};

const keyNames = {
  ctrlKey: 'Ctrl',
  altKey: 'Alt',
  shiftKey: 'Shift',
};

const ignoreKeys = [
  'CapsLock',
  'Shift',
  'Control',
  'Alt',
  'Delete',
  'Insert',
  'PageDown',
  'PageUp',
  'NumLock',
  'Clear',
];

const storedData = Object.assign({}, defaultData);
let focusedShortcut;

window.addEventListener('DOMContentLoaded', init);

async function init() {
  // eslint-disable-next-line no-undef
  replace({ class: 'feather-icon' });
  const data = await chrome.storage.local.get();
  Object.assign(storedData, data);
  console.log(storedData);
  assignValue(nSuggestInput, storedData.num_suggest);
  assignValue(temperatureRange, storedData.temperature);
  manualComplete.checked = storedData.manual_complete;
  keybindingsShorthands.forEach((shorthand) => {
    const key = shorthand.getAttribute('data-shorthand-for');
    const shortcut = storedData?.shortcuts[key] || defaultData.shortcuts[key];
    shorthand.innerHTML = Object.keys(shortcut)
      .reduce(
        (str, key) =>
        (str += shortcut[key]
          ? ` + <kbd>${keyNames[key] || shortcut[key]}</kbd>`
          : ''),
        ''
      )
      .substring(2)
      .trim();
  });
}

function assignValue(element, value) {
  element.value = value;
}

revealButton.addEventListener('click', () => {
  const { apikey } = storedData;
  apiKey.value = apikey.trim();
  makeVisible(apiKey);
  makeInvisible(revealButton);
  makeVisible(copyWrapper);
});

editKey.addEventListener('click', () => {
  apiKey.value = '';
  enableInputElement(apiKey);
  makeVisible(apiKey);
  makeInvisible(revealButton);
  makeInvisible(copyWrapper);
  apiKey?.focus();
});

saveButton.addEventListener('click', async () => {
  makeInvisible(messageElement);
  const options = {
    apikey: apiKey?.value || undefined,
    num_suggest: nSuggestInput?.value || undefined,
    temperature: temperatureRange?.value || undefined,
    manual_complete: manualComplete?.checked,
  };
  await chrome.storage.local.set(options);
  disableInputElement(apiKey);
  messageElement.innerHTML = 'Saved Successfully!';
  makeVisible(messageElement);
  setTimeout(() => makeInvisible(messageElement), 2000);
});

resetButton.addEventListener('click', () => {
  assignValue(nSuggestInput, defaultData.num_suggest);
  assignValue(temperatureRange, defaultData.temperature);
  manualComplete.checked = defaultData.manual_complete;
});

copyButton.addEventListener('click', () => {
  makeInvisible(messageElement);
  try {
    window.navigator.clipboard.writeText(storedData.apikey);
    messageElement.innerHTML = 'Copied Successfully!';
  } catch (error) {
    console.error(error);
    messageElement.innerHTML = 'Copying Error!';
  } finally {
    makeVisible(messageElement);
    setTimeout(() => makeInvisible(messageElement), 2000);
  }
});

keybindingsShorthands.forEach((shorthand) =>
  shorthand.addEventListener('click', openModal)
);

function openModal(event) {
  const clickedShortcut = event.currentTarget;
  focusedShortcut = clickedShortcut;
  modal.showModal();
  window.addEventListener('keydown', handleKeydown);
}

function handleKeydown(event) {
  event.preventDefault();

  if (ignoreKeys.includes(event.key)) return;
  if (event.key === 'Escape') return closeModal();

  const newCut = {
    ctrlKey: event.ctrlKey,
    altKey: event.altKey,
    shiftKey: event.shiftKey,
    key: event.key,
  };

  if (
    !newCut.ctrlKey &&
    !newCut.altKey &&
    !newCut.shiftKey &&
    newCut.key !== 'Tab'
  )
    return;

  const shortcutFor = focusedShortcut?.getAttribute('data-shorthand-for');
  modalHeading.innerHTML = `New Shortcut for ${shortcutFor.toUpperCase()} Suggestion`;
  newKeybinding.innerHTML = Object.keys(newCut)
    .reduce(
      (str, key) =>
      (str += newCut[key]
        ? ` + <kbd>${keyNames[key] || newCut[key]}</kbd>`
        : ''),
      ''
    )
    .substring(2)
    .trim();

  makeInvisible(keyboardShortcutDialog);
  makeVisible(newKeybinding);
  makeVisible(changeShortcutBtn);
  window.removeEventListener('keydown', handleKeydown);

  saveShortcutBtn.disabled = false;
  saveShortcutBtn.addEventListener('click', () => saveShortcut(newCut));
}

modalCancelButton.addEventListener('click', closeModal);

async function saveShortcut(shortcut) {
  const shortcutFor = focusedShortcut?.getAttribute('data-shorthand-for');
  await chrome.storage.local.set({
    shortcuts: {
      [shortcutFor]: shortcut,
    },
  });
  closeModal();
}

changeShortcutBtn.addEventListener('click', () => {
  window.addEventListener('keydown', handleKeydown);
  resetModal();
});

function resetModal() {
  makeInvisible(newKeybinding);
  makeInvisible(changeShortcutBtn);
  makeVisible(keyboardShortcutDialog);
}

function closeModal() {
  window.removeEventListener('keydown', handleKeydown);
  resetModal();
  modal.close();
}

modal.addEventListener('click', (e) => {
  const dialogDimensions = modal.getBoundingClientRect();
  if (
    e.clientX < dialogDimensions.left ||
    e.clientX > dialogDimensions.right ||
    e.clientY < dialogDimensions.top ||
    e.clientY > dialogDimensions.bottom
  ) {
    closeModal();
  }
});

function makeInvisible(element) {
  element?.classList?.add('invisible');
}

function makeVisible(element) {
  element?.classList?.remove('invisible');
}

function toggleVisibility(element) {
  element?.classList?.toggle('invisible');
}

function enableInputElement(element) {
  element.disabled = false;
}

function disableInputElement(element) {
  element.disabled = true;
}

// function saveToStore(key, value) {
//   chrome.storage.local.set({ [key]: value })
// }
