FROM node:alpine
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn config set "strict-ssl" false
RUN yarn install --verbose
COPY . .
RUN yarn build
EXPOSE 4000
CMD ["yarn","start:dev"]