from sentence_transformers import SentenceTransformer

sentence_encode = SentenceTransformer('roberta-large-nli-stsb-mean-tokens')

from transformers import AutoTokenizer, AutoModelWithLMHead

AutoTokenizer.from_pretrained("mrm8488/t5-base-finetuned-emotion")
AutoModelWithLMHead.from_pretrained("mrm8488/t5-base-finetuned-emotion")
from transformers import BartForConditionalGeneration, BartTokenizer

BartTokenizer.from_pretrained('facebook/bart-large-cnn')
BartForConditionalGeneration.from_pretrained('facebook/bart-large-cnn')
from transformers import LongformerTokenizer, LongformerForQuestionAnswering

LongformerTokenizer.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
# qa_tokenizer = LongformerTokenizerFast.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
LongformerForQuestionAnswering.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
