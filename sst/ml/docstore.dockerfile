# separate build-stage to install git for pip-installing git repos,
# but don't keep git + deps around
FROM public.ecr.aws/lambda/python:3.9 as custom_pips
RUN yum install git -y
RUN pip3 install --no-cache-dir --target=/tmp/pip \
    # torch goes first to ensure CPU-only respected
    torch==1.12 --extra-index-url https://download.pytorch.org/whl/cpu \
    # tell downstream we already have transformers
    #farm-haystack[weaviate]==1.11.0 \
    git+https://github.com/lefnire/haystack@main#egg=farm-haystack \
    weaviate-client==3.9.0 \
    # cleantext
    markdown2==2.4.6 \
    python-box==6.1.0 \
    markdownify==0.11.6 \
    html5lib===1.1 \
    clean-text==0.6.0 \
    unidecode==1.3.6 \
    # having a lot of trouble with haystack's preferred version (4.22.1)
    && pip3 install --no-cache-dir --target=/tmp/pip transformers==4.25.1

FROM public.ecr.aws/lambda/python:3.9
COPY --from=custom_pips /tmp/pip ${LAMBDA_TASK_ROOT}
COPY __init__.py ${LAMBDA_TASK_ROOT}/__init__.py
COPY common ${LAMBDA_TASK_ROOT}/common
COPY docstore ${LAMBDA_TASK_ROOT}/docstore
CMD [ "docstore/main.main" ]
