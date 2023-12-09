import {Config} from 'sst/node/config'
import openai, {OpenAI} from "openai"
import {ChatCompletionCreateParams, ChatCompletionMessageParam} from "openai/resources/chat";
import {
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

let openai_: OpenAI
function getOpenAi(): OpenAI {
  // doing it down here instead of up-top, to prevent requiring Config.OPENAI_KEY in
  // functions which won't need this
  if (openai_) {return openai_}
  openai_ = new openai.OpenAI({
    apiKey: Config.OPENAI_KEY,
  })
  return openai_
}

type Model = "gpt-4-1106-preview" | "gpt-3.5-turbo-16k"
type Message = {
  role: "user" | "system" | "assistant"
  content: string
}
export const tokenLimits = {
  "gpt-4-1106-preview": 128000,
  "gpt-3.5-turbo-16k": 16000,
}
function truncate(inputMessages: Message[], responseLimit: number, model: Model): Message[] {
  const tokenLimit = tokenLimits[model]

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
  opts: Partial<ChatCompletionCreateParams> & {
    prompt: Prompt,
    skipTruncate?: boolean
  }
): Promise<string> {
  const {prompt, skipTruncate, ...rest} = opts
  // use gpt-4 for prompt (insights), and gpt-3 for entry-level tasks like summarization.
  // Gpt3 does a decent job of that, and is faster/cheaper. Wheras prompt really benefits from a high-quality
  // psychological understanding of the text
  const model = opts.model || "gpt-4-1106-preview"
  const max_tokens = opts.max_tokens || 256

  const messages = Array.isArray(prompt) ? prompt : [
    { role: "system", content: defaultSystemMessage },
    { role: "user", content: prompt }
  ]
  const truncated = skipTruncate ? messages : truncate(messages, max_tokens, model)

  try {
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
    const res = await getOpenAi().chat.completions.create(completionRequest);
    return res.choices[0].message.content
  } catch (error) {
    Logger.error("ml/node/openai#completion", {error, truncated})
    if ([429, 503].includes(error.status)) {
      throw new Error("OpenAI overloaded, try again soon")
    }
    throw new Error(error.message)
  }
}
