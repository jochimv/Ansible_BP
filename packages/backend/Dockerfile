# Builder stage
FROM node:alpine AS builder
WORKDIR /app
COPY package.json .
RUN yarn config set "strict-ssl" false
# install development dependencies
RUN yarn install --production=false
COPY . .
RUN yarn build

# Production stage
FROM node:alpine AS production

# Install Ansible, Git, and required dependencies
RUN apk add --no-cache python3 py3-pip py3-cryptography openssh-client git
RUN pip3 install --upgrade pip
RUN pip3 install ansible

ENV NODE_ENV=production
WORKDIR /app

COPY package.json .
RUN yarn config set "strict-ssl" false
# install production dependencies
RUN yarn install --production=true
# dist folder contains compiled code
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/ansible_repos ./ansible_repos

EXPOSE 4000
CMD ["yarn","start:prod"]