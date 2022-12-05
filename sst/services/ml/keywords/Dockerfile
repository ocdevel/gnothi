FROM public.ecr.aws/lambda/python:3.9 AS model
RUN curl -s https://packagecloud.io/install/repositories/github/git-lfs/script.rpm.sh | bash
RUN yum install git-lfs -y
RUN git lfs install
RUN git clone https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2 /tmp/model
RUN rm -rf /tmp/model/.git

FROM public.ecr.aws/lambda/python:3.9
ARG FUNCTION_DIR="/var/task"
RUN mkdir -p ${FUNCTION_DIR}
COPY --from=model /tmp/model ${FUNCTION_DIR}
RUN python3.9 -m pip install --no-cache-dir \
    transformers[torch]==4.25.1 \
    sentence-transformers==2.2.2 \
    keybert==0.7.0
ENV TRANSFORMERS_CACHE=/tmp
COPY keywords.py ${FUNCTION_DIR}
CMD [ "keywords.main" ]
