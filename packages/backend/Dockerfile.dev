FROM node:alpine
WORKDIR /app
COPY package.json .
RUN yarn config set "strict-ssl" false
RUN yarn install
COPY . .
RUN yarn build
EXPOSE 4000
CMD ["yarn","start:dev"]