import { describe, it, expect, beforeAll } from "vitest";
import {completion} from '../ml/node/openai'
import {writeFileSync} from 'fs'
import {v4 as uuid} from 'uuid'

describe("setup", () => {
  it("entries", async () => {

    const tags = {
      'work': {
        prompt: "Write a fake journal entry, 3 paragraphs in length, written by someone experiencing difficulty at work. <placeholder>",
        placeholders: [
          "The journaler is just starting to experience frustration, but is hopeful.",
          "The journaler is developing real concerns.",
          "The journaler is at the verge of quitting their job."
        ]
      },
      'dreams': {
        prompt: "Write a fake dream, 3 paragraphs in length, which includes common dream symbolism and structure. <placeholder>",
        placeholders: [
          "The dream, when interpreted, is work-related",
          "The dream, when interpreted, is relationship-related",
        ]
      },
      'home': {
        prompt: "Write a fake journal entry, 3 paragraphs in length, written by someone experiencing difficulties at home. <placeholder>",
        placeholders: [
          "The journaler feels pressured by their parents.",
          "The journaler feels overwhelmed by finances.",
        ]
      },
    }

    const prompts = Object.entries(tags).map(([tag, obj]) => {
      const prompts = obj.placeholders.map(placeholder => obj.prompt.replace('<placeholder>', placeholder))
      return prompts.map(prompt => ({tag, prompt}))
    }).flat()
    const entries = await Promise.all(prompts.map(async ({tag, prompt}, i) => ({
      id: uuid(),
      tag,
      title: `${tag}-${i}`,
      text: await completion({
        prompt,
        // want to use 4096, but prompt counts against max_tokens, and I can't
        // easily count prompt tokens here. Just take easy route
        max_tokens: 3000
      })
    })))
    console.log(entries)
    const fileContent = JSON.stringify(entries)
    writeFileSync('mock_entries.json', fileContent, 'utf8');
  })
})
