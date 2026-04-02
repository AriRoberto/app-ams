FROM node:22-alpine AS deps
WORKDIR /app
COPY ["aplicativo municipal/backend/package.json", "./package.json"]
RUN npm install --omit=dev

FROM node:22-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
COPY --from=deps /app/node_modules ./node_modules
COPY ["aplicativo municipal/backend/src", "./src"]
COPY ["aplicativo municipal/backend/data", "./data"]
COPY ["aplicativo municipal/front-end", "./front-end"]
EXPOSE 3334
CMD ["node", "src/server.js"]
