FROM node
COPY ./client /app
WORKDIR /app
RUN yarn install && yarn build && yarn global add serve
ENTRYPOINT serve -s build -l tcp://0.0.0.0:80
