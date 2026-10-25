FROM node:24-alpine

ENV NODE_ENV=production \
    PORT=5000

WORKDIR /app/backend
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

WORKDIR /app
COPY --chown=node:node . .

USER node

EXPOSE 5000
CMD ["node", "server.js"]
