FROM node:20-alpine

WORKDIR /app/services/risk-engine

COPY packages/contracts /app/packages/contracts
COPY packages/risk-signals /app/packages/risk-signals
COPY services/risk-engine/package.json ./package.json
COPY services/risk-engine/package-lock.json ./package-lock.json
RUN npm install

COPY services/risk-engine/src ./src

CMD ["npm", "start"]
