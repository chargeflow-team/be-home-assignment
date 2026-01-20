FROM node:20-alpine

WORKDIR /app/services/dispute-responder

COPY packages/contracts /app/packages/contracts
COPY services/dispute-responder/package.json ./package.json
COPY services/dispute-responder/package-lock.json ./package-lock.json
RUN npm install

COPY services/dispute-responder/src ./src

CMD ["npm", "start"]
