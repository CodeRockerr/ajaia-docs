FROM node:20-alpine
WORKDIR /app
COPY package.json ./
COPY server.js ./
COPY public ./public
COPY test ./test
ENV NODE_ENV=production
ENV PORT=3000
ENV DATA_FILE=/data/store.json
RUN mkdir -p /data
EXPOSE 3000
CMD ["node", "server.js"]
