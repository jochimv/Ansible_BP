# Next.js & NestJS starter

This project contains containerized starter code for following stack:

#### frontend
- Next.js
- TypeScript
- Material-UI
- Emotion
- React-Query

#### backend
- NestJS (with Fastify)
- TypeScript
- Nodemon

#### shared
- ESlint
- Prettier
- Yarn

## How to run it

In <strong>development mode</strong>, run `docker-compose -f docker-compose.dev.yml up --build`

In <strong>production mode</strong>, run `docker-compose -f docker-compose.yml up --build`

Front-end runs on port 3000, while back-end on port 4000.