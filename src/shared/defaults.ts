export interface shortcutType {
  ctrlKey: boolean;
  altKey: boolean;
  shiftKey: boolean;
  key: string;
}

export enum ShortcutName {
  CYCLE_SUGGESTION = 'cycle',
  TRIGGER_SUGGESTION = 'trigger',
  ACCEPT_SUGGESTION = 'accept',
}

export interface storedType {
  apikey: string;
  manual_complete: boolean;
  num_suggest: string | number;
  temperature: string | number;
  shortcuts: {
    [key in ShortcutName]: shortcutType;
  };
}

const defaultData: storedType = {
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

export default defaultData;
