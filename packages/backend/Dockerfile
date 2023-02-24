FROM node:alpine
WORKDIR /app
COPY package.json .
COPY yarn.lock .
RUN yarn config set "strict-ssl" false
RUN yarn install
COPY . .
#RUN yarn add -g nodemon
RUN yarn build
EXPOSE 4000
CMD ["yarn","start:dev"]