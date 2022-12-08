See:
* https://medium.com/geekculture/how-to-deploy-a-docker-based-api-with-aws-lambda-and-cdk-51aa5b434417
* https://levelup.gitconnected.com/provisioning-lambda-docker-images-with-aws-cdk-python-a10bffd20613
* https://dev.to/wesleycheek/deploy-a-docker-built-lambda-function-with-aws-cdk-fio
* https://github.com/git-lfs/git-lfs/blob/main/INSTALLING.md

Clone the model & HF dependencies into the image, faster spin-up. More streamlined integration into SST than going SageMaker Serverless. Also, SM Serverless has more constraints (I had some 6gb RAM limit, unlike the standard 10gb for Lambda).

Consider using EFS instead of git-lfs https://aws.amazon.com/blogs/compute/hosting-hugging-face-models-on-aws-lambda/
