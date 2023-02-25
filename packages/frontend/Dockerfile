FROM node:alpine AS builder
WORKDIR /app
COPY package.json .
RUN yarn config set "strict-ssl" false
RUN yarn install --production=false
COPY . .
RUN yarn build


FROM node:alpine AS production
ENV NODE_ENV=production
WORKDIR /app

COPY package.json .
RUN yarn config set "strict-ssl" false
RUN yarn install --production=true
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["yarn","start"]