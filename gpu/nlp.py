import math, time
import torch
import numpy as np
from sentence_transformers import SentenceTransformer, models
# from transformers import pipeline
from transformers import AutoTokenizer, AutoModelWithLMHead#, AutoModelForQuestionAnswering, AutoModelForSequenceClassification

AVG_WORD_SIZE = 5

print('torch.cuda.current_device()', torch.cuda.current_device())
print('torch.cuda.device(0)', torch.cuda.device(0))
print('torch.cuda.device_count()', torch.cuda.device_count())
print('torch.cuda.get_device_name(0)', torch.cuda.get_device_name(0))
print('torch.cuda.is_available()', torch.cuda.is_available())

encoder = None
def sentence_encode(x):
    global encoder
    while encoder == -1: time.sleep(1)  # loading elsewhere
    if encoder is None:
        encoder = -1
        encoder = SentenceTransformer('roberta-base-nli-stsb-mean-tokens')
        # word_embedding_model = models.Transformer('allenai/longformer-base-4096')
        # pooling_model = models.Pooling(word_embedding_model.get_word_embedding_dimension())
        # encoder = SentenceTransformer(modules=[word_embedding_model, pooling_model])
    return np.array(encoder.encode(x, batch_size=128, show_progress_bar=True))

# TODO chunk sentiment? (or is it fine with chunked summaries?)
sent_tokenizer = None
sent_model = None
sent_max = 512
def sentiment(text):
    global sent_model, sent_tokenizer
    while sent_model == -1: time.sleep(1)  # loading elsewhere
    if sent_model is None:
        sent_model = sent_tokenizer = -1
        sent_tokenizer = AutoTokenizer.from_pretrained("mrm8488/t5-base-finetuned-emotion")
        sent_model = AutoModelWithLMHead.from_pretrained("mrm8488/t5-base-finetuned-emotion").to("cuda")

    if not text:
        return [{"label": "", "score": 1.}]

    input_ids = sent_tokenizer.encode(text + '</s>', return_tensors='pt', max_length=sent_max).to("cuda")
    output = sent_model.generate(input_ids=input_ids, max_length=2)
    dec = [sent_tokenizer.decode(ids) for ids in output]
    label = dec[0]
    return [{"label": label, "score": 1.}]

# Keeping Bart for now, max_length=1024 where T5=512. Switch to Longformer or LongBart when available
# https://github.com/huggingface/transformers/issues/4406
# TODO also not automatically using tokenizer max_length like it used to, getting srcIndex < srcSelectDimSize
# when using pipeline()
# https://github.com/huggingface/transformers/issues/4501
# https://github.com/huggingface/transformers/issues/4224
from transformers import BartForConditionalGeneration, BartTokenizer
sum_model = sum_tokenizer = None
sum_max = 1024
def summarize(text, max_length=None, min_length=None):
    global sum_model, sum_tokenizer
    if not text:
        return [{"summary_text": "Nothing to summarize (try adjusting date range)"}]

    while sum_model == -1: time.sleep(1)  # loading elsewhere
    if sum_model is None:
        sum_model = sum_tokenizer = -1
        sum_tokenizer = BartTokenizer.from_pretrained('facebook/bart-large-cnn')
        sum_model = BartForConditionalGeneration.from_pretrained('facebook/bart-large-cnn').to("cuda")

    tokens_all = sum_tokenizer.encode(text, return_tensors='pt').to("cuda")
    if max_length and tokens_all.shape[1] <= max_length:
        return [{"summary_text": text}]
    n_parts = math.ceil(tokens_all.shape[1] / sum_max)
    tokens_all = sum_tokenizer.encode(text, return_tensors='pt', max_length=sum_max * n_parts,
                                      pad_to_max_length=True).to("cuda")
    sum_args = dict(num_beams=4, early_stopping=True)
    if n_parts == 1:
        summary_ids = sum_model.generate(tokens_all, max_length=max_length, min_length=min_length, **sum_args)
    else:
        max_part = int(max_length / n_parts) if max_length else None
        summary_ids = []
        for i in range(n_parts):
            min_part = None
            if min_length and i < (n_parts - 1):
                min_part = int(min_length / n_parts)
            tokens_part = tokens_all[:, i * sum_max: (i + 1) * sum_max]
            # FIXME generate as batch ([batch_size, tokens])
            summary_ids += sum_model.generate(tokens_part, max_length=max_part, min_length=min_part, **sum_args)
        summary_ids = torch.cat(summary_ids).unsqueeze(0)
        ## Min/max size already accounted for above
        # summary_ids = sum_model.generate(summary_ids, max_length=max_length, min_length=min_length)
    summary = [
        sum_tokenizer.decode(s, skip_special_tokens=True, clean_up_tokenization_spaces=False)
        for s in summary_ids
    ]
    return [{"summary_text": summary[0]}]


from transformers import LongformerTokenizer, LongformerForQuestionAnswering
qa_model = qa_tokenizer = None
qa_max = 4096
def qa_longformer(question, context):
    global qa_model, qa_tokenizer
    if not context:
        return [{'answer': "Not enough entries to use this feature."}]

    while qa_model == -1: time.sleep(1)  # loading elsewhere
    if not qa_model:
        qa_model = qa_tokenizer = -1
        qa_tokenizer = LongformerTokenizer.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
        # qa_tokenizer = LongformerTokenizerFast.from_pretrained("allenai/longformer-large-4096-finetuned-triviaqa")
        qa_model = LongformerForQuestionAnswering.from_pretrained(
            "allenai/longformer-large-4096-finetuned-triviaqa").to("cuda")
        # Revert to simple line, delete the rest when fixed: https://github.com/huggingface/transformers/issues/4934
        # Error: CUDA out of memory. Tried to allocate 3.11 GiB (GPU 0; 11.00 GiB total capacity; 6.97 GiB already allocated; 2.71 GiB free; 7.03 GiB reserved in total by PyTorch)
        # https://github.com/patrickvonplaten/notebooks/blob/master/How_to_evaluate_Longformer_on_TriviaQA_using_NLP.ipynb


    # FIXME use smarter 4096 recent tokens here
    answers = []
    max_chars = qa_max * AVG_WORD_SIZE
    for i in range(int(len(context) / max_chars)):
        context_ = context[i * max_chars:(i + 1) * max_chars]
        encoding = qa_tokenizer.encode_plus(question, context_, return_tensors="pt", max_length=qa_max)
        input_ids = encoding["input_ids"].to("cuda")
        attention_mask = encoding["attention_mask"].to("cuda")
        with torch.no_grad():
            start_scores, end_scores = qa_model(input_ids=input_ids, attention_mask=attention_mask)
        all_tokens = qa_tokenizer.convert_ids_to_tokens(encoding["input_ids"][0].tolist())
        answer_tokens = all_tokens[torch.argmax(start_scores): torch.argmax(end_scores) + 1]
        # remove space prepending space token and remove unnecessary '"'
        answer = qa_tokenizer.decode(qa_tokenizer.convert_tokens_to_ids(answer_tokens))[1:].replace('"', '')
        if len(answer) > 200:
            answer = summarize(answer, max_length=20)[0]["summary_text"]
        if answer not in answers:
            answers.append(answer)
    if not answers: return [{'answer': 'No answer'}]
    return [{'answer': a} for a in answers]