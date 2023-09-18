import os
from common.env import USE_GPU, MODELS_PATH
from ctransformers import AutoModelForCausalLM
from pathlib import Path


# model = pipeline(
#     "summarization",
#     model=model,
#     tokenizer=tokenizer,
#     # no_repeat_ngram_size=2,
#     truncation=True,
#     # repetition_penalty=1.0,
#     # early_stopping=True,
#     # # num_beams=4,
#     #
#     # # When trying num_beam_groups I get: Passing `max_length` to BeamSearchScorer is deprecated and has no effect. `max_length` should be passed directly to `beam_search(...)`, `beam_sample(...)`, or `group_beam_search(...)`.
#     # num_beams=6,
#     # num_beam_groups=3,
#     # diversity_penalty=2.0,
#     # # temperature=1.5,
# )

TS_FORMAT = """```typescript
{
  "title": string // a short headline 
  "summary": string // a summary of the entry, highlighting the key points
  "emotion": "anger"|"disgust"|"fear"|"joy"|"neutral"|"sadness"|"surprise"
  "themes": Array<{ // an array of 1-3 core themes present in the entry
    "title": string // 1-3 words for this theme
    "summary": string // a sentence summarizing the theme
    "keywords": string[] // an array of words or key-phrases in the theme
  }>
}
```"""

SAMPLE_JSON = """```json
{
  "title": "The singularity is near",
  "summary": "Artificial intelligence is improving at a rapid clip. Large language models like GPT4 and Llama are increasingly capable, passing various human benchmarks like the Bar Exam, and even the Turing test. Stable Diffusion is able to create art which is indistinguishable from human creativity. Neural Link is coming soon, a harbinger of full-dive VR. Video games now have AI NPCs, which can talk and act creatively in their environments.",
  "emotion": "surprise",
  "themes": [
    {"title": "Large Language Models", "keywords": ["llm", "gpt", "openai"], "summary": "LLMs like GPT pass the Turing Test"},
    {"title": "AI Art", "keywords": ["art", "stable-diffusion", "midjourney"], "AI art is near-perfect",
    {"title": "Virtual Reality", "keywords": ["vr", "games", "bci"], "VR is incorporating AI via AI NPCs, generative art, and Brain Computer Interfaces"
  ]
}
```"""

# Prompt template: https://gpus.llm-utils.org/llama-2-prompt-template/
PROMPT = f"""[INST]
Between >>> and <<< is a journal entry. Convert it to JSON with the following format:
{TS_FORMAT}
>>> [JOURNAL] <<< [/INST]"""


### https://huggingface.co/models?sort=trending&search=llama-2+gguf
# https://huggingface.co/TheBloke/Llama-2-7B-32K-Instruct-GGUF
model = {
    "repo": "TheBloke/Llama-2-7B-32K-Instruct-GGUF",
    "file": "llama-2-7b-32k-instruct.Q2_K.gguf",
    "url": "https://huggingface.co/TheBloke/Llama-2-7B-32K-Instruct-GGUF/resolve/main/llama-2-7b-32k-instruct.Q2_K.gguf"
}
# https://huggingface.co/TheBloke/Llama-2-7b-Chat-GGUF
# model = ["TheBloke/Llama-2-7B-Chat-GGML","llama-2-7b-chat.Q2_K.gguf"]

# Set gpu_layers to the number of layers to offload to GPU. Set to 0 if no GPU acceleration is available on your system.
#llm = AutoModelForCausalLM.from_pretrained("TheBloke/Llama-2-13B-chat-GGML", model_file="llama-2-13b-chat.q4_K_M.gguf", model_type="llama", gpu_layers=50)


model_path = f"{MODELS_PATH}/{model['file']}"
if not Path(model_path).resolve().is_file():
    os.system(f"wget -O {model_path} {model['url']}")

llm = AutoModelForCausalLM.from_pretrained(
    MODELS_PATH,
    # model["repo"],
    model_file=model['file'],
    model_type="llama",
    gpu_layers=0,
    temperature=0.1,
    max_new_tokens=1024,
    context_length=30000,
    stop=["[INST]", "[/INST]", "[SYS]", "[/SYS]"]
)


def main(event, context):
    prompt = PROMPT.replace("[JOURNAL]", event['texts'])
    output = llm(prompt)
    # for text in llm(model[2], stream=True):
    #     print(text, end="", flush=True)
    return {
        'data': output
    }