FROM node:alpine AS builder
WORKDIR /app
COPY package.json .
RUN yarn config set "strict-ssl" false
# install development dependencies
RUN yarn install --production=false
COPY . .
RUN yarn build


FROM node:alpine AS production
ENV NODE_ENV=production
WORKDIR /app

COPY package.json .
RUN yarn config set "strict-ssl" false
# install production dependencies
RUN yarn install --production=true
# dist folder contains compiled code
COPY --from=builder /app/dist ./dist

EXPOSE 4000
CMD ["yarn","start:prod"]

