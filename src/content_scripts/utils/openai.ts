export function autoCompleteWithGPT(
  openaikey: string,
  numSuggest: number,
  msg: string,
  signal: AbortSignal
) {
  const data = {
    model: 'text-davinci-edit-001',
    input: msg,
    instruction: 'complete the unfinished sentences',
    n: numSuggest,
  };

  return fetch('https://api.openai.com/v1/edits', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openaikey}`,
    },
    body: JSON.stringify(data),
    signal: signal,
  });
}

export interface OpenAIEditResponeType {
  object: string;
  created: number;
  choices: Array<{ text: string; index: number }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
