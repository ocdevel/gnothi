import {Config} from 'sst/node/config'
import {
  Configuration,
  OpenAIApi,
  CreateCompletionRequest,
  CreateCompletionRequestPrompt,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse,
  ErrorResponse
} from "openai"
import { encode, decode } from 'gpt-token-utils'
import _ from 'lodash'

import {Logger} from "../../aws/logs";

// "You are a supportive companion."
// "You are a reflective assistant."
// "You are an empathetic listener."
// "You are an interactive journal guide."
// "You are a conversational support system."
export const defaultSystemMessage = "You are an insightful guide."

let openai: OpenAIApi
function getOpenAi() {
  // doing it down here instead of up-top, to prevent requiring Config.OPENAI_KEY in
  // functions which won't need this
  if (openai) {return openai}
  const configuration = new Configuration({
    apiKey: Config.OPENAI_KEY,
  })
  openai = new OpenAIApi(configuration);
  return openai
}

type Model = "gpt-4" | "gpt-3.5-turbo-16k" | "gpt-3.5-turbo"
type Message = {
  role: "user" | "system" | "assistant"
  content: string
}
function truncate(inputMessages: Message[], responseLimit: number, model: Model): Message[] {
  const gpt4 = model === "gpt-4";
  const tokenLimit = {
    "gpt-4": 8000,
    "gpt-3.5-turbo": 4096,
    "gpt-3.5-turbo-16k": 16000,
  }[model]

  // Create a deep copy of the messages
  let messages = _.cloneDeep(inputMessages);

  let totalTokens = _.sumBy(messages, message => encode(message.content).tokens.length);

  if (totalTokens > tokenLimit - responseLimit) {
    const tokensToDiscard = totalTokens - (tokenLimit - responseLimit);
    let discardedTokens = 0;

    for (let i = 0; i < messages.length; i++) {
      const messageTokens = encode(messages[i].content).tokens.length;

      if (discardedTokens + messageTokens <= tokensToDiscard) {
        discardedTokens += messageTokens;
        messages[i].content = "";
      } else {
        const tokensToKeep = messageTokens - (tokensToDiscard - discardedTokens);
        messages[i].content = decode(encode(messages[i].content).tokens.slice(0, tokensToKeep));
        break;
      }
    }
  }

  // Remove messages that have been completely truncated
  messages = messages.filter((message) => message.content !== "");

  return messages;
}


export type Prompt = string | Message[]

// 0d5c00b81263fb653e89d9dae95f15fc9d14f078 - davinci-003 and standard completions (10x cost)
export async function completion(
  opts: Partial<CreateChatCompletionRequest> & {
    prompt: Prompt
  }
): Promise<string> {
  const {prompt, ...rest} = opts
  // use gpt-4 for prompt (insights), and gpt-3 for entry-level tasks like summarization.
  // Gpt3 does a decent job of that, and is faster/cheaper. Wheras prompt really benefits from a high-quality
  // psychological understanding of the text
  const model = opts.model || "gpt-3.5-turbo-16k"
  const max_tokens = opts.max_tokens || 256

  const messages = Array.isArray(prompt) ? prompt : [
    { role: "system", content: defaultSystemMessage },
    { role: "user", content: prompt }
  ]
  const truncated = truncate(messages, max_tokens, model)

  try {
    const {prompt, ...rest} = opts
    const completionRequest: CreateChatCompletionRequest = {
      model,
      temperature: 0.2, // gpt suggests 0.2-0.4
      max_tokens,
      top_p: .8, // gpt suggest 0.8, my preference was 1.0
      frequency_penalty: .5, // gpt suggest 0.5, my preference was 1.0
      presence_penalty: .5, // gpt suggest 0.5, my preference was 0.25
      // best_of
      ...rest ,
      messages: truncated
    }
    const res = await getOpenAi().createChatCompletion(completionRequest);
    return res.data.choices[0].message.content
  } catch (error) {
    Logger.error("ml/node/openai#completion", {error, truncated})
    if ([429, 503].includes(error.status)) {
      throw new Error("OpenAI overloaded, try again soon")
    }
    throw new Error(error.message)
  }
}
