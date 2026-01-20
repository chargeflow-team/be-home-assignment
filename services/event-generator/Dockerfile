FROM node:20-alpine

WORKDIR /app/services/event-generator

COPY packages/contracts /app/packages/contracts
COPY services/event-generator/package.json ./package.json
COPY services/event-generator/package-lock.json ./package-lock.json
RUN npm install

COPY services/event-generator/src ./src

CMD ["npm", "start"]
