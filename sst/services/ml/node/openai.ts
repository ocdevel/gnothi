import {Config} from '@serverless-stack/node/config'
import { Configuration, OpenAIApi, CreateCompletionRequest, CreateCompletionRequestPrompt } from "openai"

const configuration = new Configuration({
  apiKey: Config.openai_key,
})
const openai = new OpenAIApi(configuration);

export async function completion(
  opts: Partial<CreateCompletionRequest> & {
    prompt: CreateCompletionRequestPrompt // just mark as required
  }
): Promise<string> {
  try {
    const res = await openai.createCompletion({
      model: 'text-davinci-003',
      temperature: 0.0,
      max_tokens: 256, // 4096 - prompt.len - 256 = 0
      top_p: 1,
      frequency_penalty: 1.,
      presence_penalty: .25,
      // best_of
      ...opts
    });
    return res.data.choices[0].text
  } catch (error) {
    if (error.response) {
      console.error(error.response.status);
      console.error(error.response.data);
    } else {
      console.error(error.message);
    }
    throw error
  }
}
