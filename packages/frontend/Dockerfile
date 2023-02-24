FROM node:alpine
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn config set "strict-ssl" false
RUN yarn install
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "dev"]