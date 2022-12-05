FROM public.ecr.aws/lambda/python:3.9 AS model
RUN curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.rpm.sh | bash
RUN yum install git-lfs -y
RUN git lfs install
RUN git clone https://huggingface.co/ccdv/lsg-bart-base-4096-wcep /tmp/model
RUN rm -rf /tmp/model/.git

FROM public.ecr.aws/lambda/python:3.9
ARG FUNCTION_DIR="/var/task"
RUN mkdir -p ${FUNCTION_DIR}
COPY --from=model /tmp/model ${FUNCTION_DIR}/model
RUN python3.9 -m pip install --no-cache-dir \
    transformers[torch]==4.25.1
#RUN pip install --no-cache-dir transformers[torch]==4.21.2 --target ${LAMBDA_TASK_ROOT}
ENV TRANSFORMERS_CACHE=/tmp
COPY summarize.py ${FUNCTION_DIR}
CMD [ "summarize.main" ]
