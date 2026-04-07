FROM node:22-alpine
WORKDIR /app/backend
COPY backend/package.json ./package.json
RUN npm install --omit=dev
COPY backend ./
COPY frontend ../frontend
EXPOSE 3340
CMD ["node", "server.js"]
