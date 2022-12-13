# A different approach than currentl (EFS-mount): clone the model into the docker image. This can be quite large,
# and incurs Lambda startup time & CDK deployment time

FROM public.ecr.aws/lambda/python:3.9 AS model
RUN curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.rpm.sh | bash
RUN yum install git-lfs -y
RUN git lfs install
RUN git clone https://huggingface.co/ccdv/lsg-bart-base-4096-wcep /tmp/model
RUN rm -rf /tmp/model/.git

FROM public.ecr.aws/lambda/python:3.9
COPY --from=model /tmp/model ${LAMBDA_TASK_ROOT}/model
RUN python3.9 -m pip install --no-cache-dir \
    transformers[torch]==4.25.1
ENV TRANSFORMERS_CACHE=/tmp
COPY summarize.py ${LAMBDA_TASK_ROOT}
CMD [ "summarize.main" ]
