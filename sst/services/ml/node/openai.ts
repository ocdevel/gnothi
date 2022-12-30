import {Config} from '@serverless-stack/node/config'
const { Configuration, OpenAIApi } = require("openai");

const configuration = new Configuration({
  apiKey: Config.openai_key,
})
const openai = new OpenAIApi(configuration);

export async function completion(prompt, model='text-davinci-003'): Promise<string> {
  const res = await openai.createCompletion({
    model,
    prompt,

    temperature: 0.7,
    max_tokens: 256,
    top_p: 1,
    // frequency_penalty
    // presence_penalty
    // best_of
  });
  return res.data.choices[0].text
}
