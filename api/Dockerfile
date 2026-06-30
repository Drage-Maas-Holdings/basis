FROM node:22-alpine AS base

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY tsconfig.json drizzle.config.ts rolldown.config.js ./
COPY src/ ./src/

RUN npm run build

RUN addgroup -S appgroup && adduser -S appuser -G appgroup
RUN mkdir -p /data && chown appuser:appgroup /data

USER appuser

EXPOSE 3000

CMD ["node", "dist/index.js"]
