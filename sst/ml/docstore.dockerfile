FROM public.ecr.aws/lambda/python:3.9
RUN pip3 install --no-cache-dir \
    # torch goes first to ensure CPU-only respected
    torch==1.13.0 --extra-index-url https://download.pytorch.org/whl/cpu \
    # tell downstream we already have transformers
    transformers==4.25.1 \
    git+https://github.com/lefnire/haystack@master#egg=haystack \
    #farm-haystack[weaviate]==1.11.0 \
    weaviate-client==3.9.0 \
    # cleantext
    markdown2==2.4.6 \
    python-box==6.1.0 \
    markdownify==0.11.6 \
    html5lib===1.1 \
    clean-text==0.6.0 \
    unidecode==1.3.6

COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY docstore ${LAMBDA_TASK_ROOT}/docstore
CMD [ "docstore/main.main" ]
