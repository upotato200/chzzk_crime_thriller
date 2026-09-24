FROM node:24-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev
COPY profiler/server ./profiler/server
COPY profiler/dist ./profiler/dist
ENV NODE_ENV=production
USER node
CMD ["npm", "start"]
