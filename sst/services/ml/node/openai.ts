import {Config} from 'sst/node/config'
import {
  Configuration,
  OpenAIApi,
  CreateCompletionRequest,
  CreateCompletionRequestPrompt,
  CreateChatCompletionRequest,
  CreateChatCompletionResponse
} from "openai"
import {Logger} from "../../aws/logs";

const configuration = new Configuration({
  apiKey: Config.OPENAI_KEY,
})
const openai = new OpenAIApi(configuration);

// 0d5c00b81263fb653e89d9dae95f15fc9d14f078 - davinci-003 and standard completions (10x cost)
export async function completion(
  opts: Partial<CreateCompletionRequest> & {
    prompt: string // just mark as required
  }
): Promise<string> {
  try {
    const {prompt, ...rest} = opts
    const res = await openai.createChatCompletion({
      model: 'gpt-3.5-turbo',
      temperature: 0.0, // 0.5
      max_tokens: 256, // 4096 - prompt.len - 256 = 0
      top_p: 1,
      frequency_penalty: 1., // 2.0
      presence_penalty: .25, // 1.0
      // best_of
      ...rest,
      messages: [
        {"role": "system", "content": "You are a helpful therapist."},
        {"role": "user", "content": prompt}
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
