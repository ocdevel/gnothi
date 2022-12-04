"""
Custom Summarizer Haystack Node. See:
* Original code: https://github.com/deepset-ai/haystack/blob/main/haystack/nodes/summarizer/transformers.py
* Reason for custom: https://github.com/deepset-ai/haystack/issues/3650
"""

import itertools
from typing import List, Optional, Set, Union, Dict

import logging

import torch
from tqdm.auto import tqdm

from haystack.schema import Document
from haystack.nodes.base import BaseComponent
from haystack.nodes.summarizer import BaseSummarizer, TransformersSummarizer
from haystack.modeling.utils import initialize_device_settings
from haystack.utils.torch_utils import ListDataset

from transformers import AutoTokenizer, AutoModelForSeq2SeqLM, pipeline

logger = logging.getLogger(__name__)

model_name = "ccdv/lsg-bart-base-4096-wcep"
tokenizer = AutoTokenizer.from_pretrained(model_name, trust_remote_code=True)
model = AutoModelForSeq2SeqLM.from_pretrained(model_name, trust_remote_code=True)
pipe = pipeline("summarization", model=model, tokenizer=tokenizer)


def main(event, context) -> str:
    text = event['text']
    params = event['params']
    params = {
        'no_repeat_ngram_size': 2,

        # ensure quality
        'num_beams': 6,
        'num_beam_groups': 3,
        'diversity_penalty': 2.0,
        # 'temperature': 1.5,

        # required in case content is still too long for model
        'truncation': True,

        # The repetition penalty is meant to avoid sentences that repeat themselves without anything really interesting.
        'repetition_penalty': 1.0,

        # I think just used to speed things up (across beam-search)
        'early_stopping': True,

        **params
    }
    return pipe(text, **params)[0]['summary_text']


class CustomSummarizer(BaseComponent):
    outgoing_edges = 1

    def __init__(
        self,
        model_name_or_path: str = "ccdv/lsg-bart-base-4096-wcep",
        model_version: Optional[str] = None,
        tokenizer: Optional[str] = None,
        use_gpu: bool = True,
        clean_up_tokenization_spaces: bool = True,
        batch_size: int = 16,
        progress_bar: bool = True,
        use_auth_token: Optional[Union[str, bool]] = None,
        devices: Optional[List[Union[str, torch.device]]] = None,
    ):
        super().__init__()

        self.devices, _ = initialize_device_settings(devices=devices, use_cuda=use_gpu, multi_gpu=False)
        if len(self.devices) > 1:
            logger.warning(
                f"Multiple devices are not supported in {self.__class__.__name__} inference, "
                f"using the first device {self.devices[0]}."
            )

        if tokenizer is None:
            tokenizer = AutoTokenizer.from_pretrained(model_name_or_path, trust_remote_code=True)

        model = AutoModelForSeq2SeqLM.from_pretrained(model_name_or_path, trust_remote_code=True)

        self.summarizer = pipeline(
            task="summarization",
            model=model,
            tokenizer=tokenizer,
            revision=model_version,
            device=self.devices[0],
            use_auth_token=use_auth_token,
        )
        self.clean_up_tokenization_spaces = clean_up_tokenization_spaces
        self.print_log: Set[str] = set()
        self.batch_size = batch_size
        self.progress_bar = progress_bar

    def run(self, documents: List[Document], hf_args: Optional[Dict] = {}):  # type: ignore

        results: Dict = {"documents": []}

        if documents:
            results["documents"] = self.predict(documents=documents, hf_args=hf_args)

        return results, "output_1"

    def run_batch(  # type: ignore
        self,
        documents: Union[List[Document], List[List[Document]]],
        generate_single_summary: Optional[bool] = None,
        batch_size: Optional[int] = None,
    ):

        results = self.predict_batch(
            documents=documents, batch_size=batch_size, generate_single_summary=generate_single_summary
        )

        return {"documents": results}, "output_1"

    def predict(
        self,
        documents: List[Document],
        min_length: int = 5,
        max_length: int = 200,
        **hf_args
    ) -> List[Document]:
        if min_length > max_length:
            raise AttributeError("min_length cannot be greater than max_length")

        if len(documents) == 0:
            raise AttributeError("Summarizer needs at least one document to produce a summary.")

        contexts: List[str] = [doc.content for doc in documents]

        encoded_input = self.summarizer.tokenizer(contexts, verbose=False)
        for input_id in encoded_input["input_ids"]:
            tokens_count: int = len(input_id)
            if tokens_count > self.summarizer.tokenizer.model_max_length:
                truncation_warning = (
                    "One or more of your input document texts is longer than the specified "
                    f"maximum sequence length for this summarizer model. "
                    f"Generating summary from first {self.summarizer.tokenizer.model_max_length}"
                    f" tokens."
                )
                if truncation_warning not in self.print_log:
                    logger.warning(truncation_warning)
                    self.print_log.add(truncation_warning)

        summaries = self.summarizer(
            contexts,
            min_length=min_length,
            max_length=max_length,
            return_text=True,
            clean_up_tokenization_spaces=self.clean_up_tokenization_spaces,
            truncation=True,
            **hf_args
        )

        result: List[Document] = []

        for summary, document in zip(summaries, documents):
            document.meta.update({"summary": summary["summary_text"]})
            result.append(document)

        return result

    def predict_batch(
        self,
        documents: Union[List[Document], List[List[Document]]],
        batch_size: Optional[int] = None,
        min_length: int = 5,
        max_length: int = 200,
        **hf_args
    ) -> Union[List[Document], List[List[Document]]]:
        if min_length > max_length:
            raise AttributeError("min_length cannot be greater than max_length")

        if len(documents) == 0 or (
            isinstance(documents[0], list) and all(len(docs) == 0 for docs in documents if isinstance(docs, list))
        ):
            raise AttributeError("Summarizer needs at least one document to produce a summary.")

        if batch_size is None:
            batch_size = self.batch_size

        is_doclist_flat = isinstance(documents[0], Document)
        if is_doclist_flat:
            contexts = [doc.content for doc in documents if isinstance(doc, Document)]
        else:
            contexts = [
                [doc.content for doc in docs if isinstance(doc, Document)]
                for docs in documents
                if isinstance(docs, list)
            ]
            number_of_docs = [len(context_group) for context_group in contexts]
            contexts = list(itertools.chain.from_iterable(contexts))

        encoded_input = self.summarizer.tokenizer(contexts, verbose=False)
        for input_id in encoded_input["input_ids"]:
            tokens_count: int = len(input_id)
            if tokens_count > self.summarizer.tokenizer.model_max_length:
                truncation_warning = (
                    "One or more of your input document texts is longer than the specified "
                    f"maximum sequence length for this summarizer model. "
                    f"Generating summary from first {self.summarizer.tokenizer.model_max_length}"
                    f" tokens."
                )
                logger.warning(truncation_warning)
                break

        summaries = []
        # HF pipeline progress bar hack, see https://discuss.huggingface.co/t/progress-bar-for-hf-pipelines/20498/2
        summaries_dataset = ListDataset(contexts)
        for summary_batch in tqdm(
            self.summarizer(
                summaries_dataset,
                min_length=min_length,
                max_length=max_length,
                return_text=True,
                clean_up_tokenization_spaces=self.clean_up_tokenization_spaces,
                truncation=True,
                batch_size=batch_size,
                **hf_args
            ),
            disable=not self.progress_bar,
            total=len(summaries_dataset),
            desc="Summarizing",
        ):
            summaries.extend(summary_batch)

        if is_doclist_flat:
            flat_result: List[Document] = []
            flat_doc_list: List[Document] = [doc for doc in documents if isinstance(doc, Document)]
            for summary, document in zip(summaries, flat_doc_list):
                document.meta.update({"summary": summary["summary_text"]})
                flat_result.append(document)
            return flat_result
        else:
            nested_result: List[List[Document]] = []
            nested_doc_list: List[List[Document]] = [lst for lst in documents if isinstance(lst, list)]

            # Group summaries together
            grouped_summaries = []
            left_idx = 0
            right_idx = 0
            for number in number_of_docs:
                right_idx = left_idx + number
                grouped_summaries.append(summaries[left_idx:right_idx])
                left_idx = right_idx

            for summary_group, docs_group in zip(grouped_summaries, nested_doc_list):
                cur_summaries = []
                for summary, document in zip(summary_group, docs_group):
                    document.meta.update({"summary": summary["summary_text"]})
                    cur_summaries.append(document)
                nested_result.append(cur_summaries)
            return nested_result
