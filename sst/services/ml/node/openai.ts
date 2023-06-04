import {Config} from 'sst/node/config'
import {
  Configuration,
  OpenAIApi,
  CreateCompletionRequest,
  CreateCompletionRequestPrompt,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse
} from "openai"
import { encode, decode } from 'gpt-token-utils'

import {Logger} from "../../aws/logs";


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

function truncate(text: string, responseLimit: number, model: "gpt-4" | "gpt-3.5-turbo") {
  // TODO use this module more effectively, it supports chat parsing (accounting for user/system, etc) https://github.com/niieani/gpt-tokenizer

  const gpt4 = model === "gpt-4"
  const tokenLimit = gpt4 ? 8000 : 4000
  const encoded = encode(text)
  // has `tokens` if successful, otherwise encodes the input as-is; eg "undefined"
  if (encoded?.tokens?.length > tokenLimit - responseLimit) {
    return decode(encoded.tokens.slice(0, tokenLimit - responseLimit))
  }
  return text
}


// 0d5c00b81263fb653e89d9dae95f15fc9d14f078 - davinci-003 and standard completions (10x cost)
export async function completion(
  opts: Partial<CreateChatCompletionRequest> & {
    prompt: string // just mark as required
  }
): Promise<string> {
  const {prompt, ...rest} = opts
  // use gpt-4 for prompt (insights), and gpt-3 for entry-level tasks like summarization.
  // Gpt3 does a decent job of that, and is faster/cheaper. Wheras prompt really benefits from a high-quality
  // psychological understanding of the text
  const model = opts.model || "gpt-3.5-turbo"
  const max_tokens = opts.max_tokens || 256

  const truncated = truncate(prompt, max_tokens, model)
  try {
    const {prompt, ...rest} = opts
    const completionRequest: CreateChatCompletionRequest = {
      model,
      temperature: 0.2, // 0.5
      max_tokens,
      top_p: 1,
      frequency_penalty: 1., // 2.0
      presence_penalty: .25, // 1.0
      // best_of
      ...rest ,
      messages: [
        {"role": "system", "content": "You are a helpful therapist."},
        {"role": "user", "content": truncated}
      ]
    }
    const res = await getOpenAi().createChatCompletion(completionRequest);
    return res.data.choices[0].message.content
  } catch (error) {
    if (error.response) {
      Logger.error({message: error.response.status, data: error.response.data, event: "ml/node/openai#completion"})
    } else {
      Logger.error({message: error.message, event: "ml/node/openai#completion"})
    }
    throw error
  }
}
