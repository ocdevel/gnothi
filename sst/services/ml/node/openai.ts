import {Config} from 'sst/node/config'
import {
  Configuration,
  OpenAIApi,
  CreateCompletionRequest,
  CreateCompletionRequestPrompt,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse
} from "openai"
import {
  encode,
  decode,
  isWithinTokenLimit,
} from 'gpt-tokenizer/model/text-davinci-003';
import {Logger} from "../../aws/logs";


const TOKEN_LIMIT = 4096
const RESPONSE_LIMIT = 256
const configuration = new Configuration({
  apiKey: Config.OPENAI_KEY,
})
const openai = new OpenAIApi(configuration);

function truncate(text) {
  const encoded = encode(text)

  if (encoded.length > TOKEN_LIMIT - RESPONSE_LIMIT) {
    return decode(encoded.slice(0, TOKEN_LIMIT - RESPONSE_LIMIT))
  }
  return text
}


// 0d5c00b81263fb653e89d9dae95f15fc9d14f078 - davinci-003 and standard completions (10x cost)
export async function completion(
  opts: Partial<CreateCompletionRequest> & {
    prompt: string // just mark as required
  }
): Promise<string> {
  const {prompt, ...rest} = opts
  const truncated = truncate(prompt)
  try {
    const {prompt, ...rest} = opts
    const res = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      temperature: 0.2, // 0.5
      max_tokens: 256, // 4096 - prompt.len - 256 = 0
      top_p: 1,
      frequency_penalty: 1., // 2.0
      presence_penalty: .25, // 1.0
      // best_of
      ...rest,
      messages: [
        {"role": "system", "content": "You are a helpful therapist."},
        {"role": "user", "content": truncated}
      ]
    });
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
