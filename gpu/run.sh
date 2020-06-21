# docker build -t gnothigpu .
#docker run -it -v $(pwd):/app --gpus all --name=gnothigpu1 gnothigpu /bin/bash
docker run -it -v $(pwd):/app --gpus all gnothigpu/2_11_0 /bin/bash