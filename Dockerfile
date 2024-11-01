FROM node:18.15.0 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:18.15.0 AS runner
RUN mkdir -p /home/node/app/node_modules && chown -R node:node /home/node/app
WORKDIR /home/node/app
COPY --chown=node:node package*.json ./
RUN npm install @nestjs/core
USER node
EXPOSE 8080
COPY --from=builder --chown=node:node /app/dist  .
# RUN npm run migration:run
CMD ["npm", "run", "start:prod"]
