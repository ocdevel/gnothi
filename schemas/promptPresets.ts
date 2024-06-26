import keyBy from "lodash/keyBy";

// Used to be maintained in .yml, but needed to import on server
export const presets = [
  {
    "category": "Self-Discovery and Growth",
    "prompts": [
      {
        "key": "self_confrontation",
        "label": "Self Confrontation",
        "prompt": "What hard truths about myself and my circumstances am I avoiding, as reflected in my recent entries?"
      },
      {
        "key": "actionable_change",
        "label": "Actionable Change",
        "prompt": "What is one thing in my life, as described in my entries, that I truly want to change, and what are the first steps I can take towards making this change?"
      },
      {
        "key": "authenticity_check",
        "label": "Authenticity Check",
        "prompt": "Are the goals I've written about truly aligned with my inner values and passions, or are they shaped by external influences?"
      }
    ]
  },
  {
    "category": "Aspirations",
    "prompts": [
      {
        "key": "dream_self_insight",
        "label": "Dream Self Insight",
        "prompt": "What are my dreams revealing about my unacknowledged desires or unresolved issues?"
      },
      {
        "key": "future_self_vision",
        "label": "Future Self Vision",
        "prompt": "Envisioning my ideal future self, what steps can I start taking today to move closer to this vision?"
      }
    ]
  },
  {
    "category": "Emotional and Psychological Wellness",
    "prompts": [
      {
        "key": "emotional_insight",
        "label": "Emotional Insight",
        "prompt": "What emotions am I consistently expressing in my entries, and what might these emotions be telling me about my needs or conflicts?"
      },
      {
        "key": "emotional_resilience",
        "label": "Emotional Resilience",
        "prompt": "Considering the challenges I've faced recently, what strategies can I develop to enhance my emotional resilience?"
      },
      {
        "key": "mindfulness_expansion",
        "label": "Mindfulness Expansion",
        "prompt": "What mindfulness or meditative practices could help me process the emotions and thoughts I've been experiencing?"
      },
      {
        "key": "cbt_rewrite",
        "label": "CBT Journal Rewrite",
        "prompt": "Rewrite the key points of my journal entry using CBT principles. Focus on identifying cognitive distortions and reframing them into more balanced and realistic thoughts. Highlight emotional responses and explore alternative, healthier perspectives. What challenges can be turned into opportunities for growth? How can I shift my thinking to foster a more positive and proactive mindset?"
      }
    ]
  },
  {
    "category": "Personal Learning and Inspiration",
    "prompts": [
      {
        "key": "personalized_learning_self",
        "label": "Personalized Learning for Self-Growth",
        "prompt": "What books or podcasts could help me expand on the themes and challenges I've written about in my journal?"
      },
      {
        "key": "inspiring_reflections",
        "label": "Inspiring Reflections",
        "prompt": "What inspiring quote or idea resonates with the themes I've been exploring in my recent entries?"
      }
    ]
  },
  {
    "category": "Dreams",
    "prompts": [
      {
        "key": "dream_interpretation",
        "label": "Dream Interpretation",
        "prompt": "Interpret the following dream(s). Focus on depth symbolism and concepts from the collective unconscious, integrated with modern interpretations of dream symbolism. The analysis will identify and focus on the most significant symbols or themes within the dream, consolidating them into a few overarching themes for interpretation. While not every element of the dream will be dissected, the analysis will delve deeply into particularly striking or unique symbols that stand out. Be bold and opinionated if appropriate, rather than vague and cookie-cutter. The goal is to offer a unified and conclusive interpretation of these themes, potentially including life advice where appropriate."
      }
    ]
  }
]

export type PromptYml = {key?: string, label: string, prompt: string}
export type CategoryYml = {category: string, prompts: PromptYml[]}
export const presetsFlat = (presets as CategoryYml[])
  .map(category => category.prompts.map(prompt => ({...prompt, category: category.category})))
  .flat()
export const presetsObj = keyBy(presetsFlat, 'key')