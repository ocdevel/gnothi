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
      temperature: 0.7,
      max_tokens: 256,
      top_p: 1,
      ...opts
      // frequency_penalty
      // presence_penalty
      // best_of
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
