# API service Dockerfile for ARTH.OS backend
# Used by docker-compose.yml under the "backend" profile

FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build --if-present

FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/api_src ./api_src
COPY --from=builder /app/api/index.js ./api/index.js

EXPOSE 5000

ENV NODE_ENV=production
ENV API_PORT=5000

CMD ["node", "api/index.js"]
