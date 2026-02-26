FROM node:20-alpine AS builder

WORKDIR /app/packages/backend

COPY packages/backend/package*.json ./

RUN npm install

COPY packages/backend/ .
COPY tsconfig.base.json /app/tsconfig.base.json

RUN npm run build

FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY packages/backend/package*.json ./
RUN npm install --omit=dev

COPY --from=builder /app/packages/backend/dist ./dist
COPY --from=builder /app/packages/backend/migrations ./migrations

RUN mkdir -p /app/uploads && \
    chown -R nodejs:nodejs /app && \
    chmod 775 /app/uploads

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3001/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "dist/index.js"]
