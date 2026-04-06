FROM node:20-alpine
WORKDIR /app

# Railway 빌드 컨텍스트 = 레포 루트 (dockerfilePath만 backend일 때)
COPY backend/package.json backend/package-lock.json ./
RUN npm ci --omit=dev

COPY backend/ ./
ENV NODE_ENV=production
CMD ["npm", "start"]
