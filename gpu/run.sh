# docker build -t gnothigpu .
docker run -it -v $(pwd):/app --gpus all --name=gnothigpu1 gnothigpu /bin/bash
docker run -it -v $(pwd):/app --gpus all 6f24094c6372 /bin/bash