from preprocess.clean import CleanText

def main(event, context):
    """
    input {method: "md2txt", text: str}
    :return: {text: clean(str), paras: [clean(str)]}
    """
    method = event.get("method", "md2txt")
    text = event["text"]
    paras = []
    if method == "md2txt":
        paras = (CleanText([text])
                 .markdown_split_paragraphs()
                 .value())
        if not paras:
            raise "No paragraphs, fix this! See entries_profiles.py"
        text = " ".join(paras)  # now clean of markdown, grouped cleanly
    else:
        raise f"Preprocess method {method} not implemented"
    return {"text": text, "paras": paras}
