FROM public.ecr.aws/lambda/python:3.9
RUN python3.9 -m pip install --no-cache-dir \
    transformers[torch]==4.25.1 \
    sentence-transformers==2.2.2 \
    keybert==0.7.0
ENV TRANSFORMERS_CACHE=/mnt/transformers_cache
ENV HF_MODULES_CACHE=/mnt/transformers_cache
COPY summarize.py ${LAMBDA_TASK_ROOT}
CMD [ "summarize.main" ]
