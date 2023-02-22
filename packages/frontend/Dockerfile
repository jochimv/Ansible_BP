FROM node:alpine
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn config set "strict-ssl" false
RUN yarn install --verbose
COPY . .
RUN yarn build
EXPOSE 3000
CMD ["yarn", "dev"]