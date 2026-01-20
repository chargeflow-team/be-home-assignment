// TODO: Import event schemas from @chargeflow/contracts for validation
// import { OrderCreatedEventSchema, PaymentAuthorizedEventSchema } from "@chargeflow/contracts";

import http from "node:http";
import { type Consumer, type EachMessagePayload, Kafka } from "kafkajs";
import { getDbClient, initDb } from "./db";

// --- Configuration ---
const port = Number(process.env.PORT ?? "3001");
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",");
const TOPIC_ORDER_CREATED = process.env.TOPIC_ORDERS ?? "orders.v1";
const TOPIC_PAYMENT_AUTHORIZED = process.env.TOPIC_PAYMENTS ?? "payments.v1";
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID ?? "risk-engine-group";

// --- Kafka Setup ---
const kafka = new Kafka({ clientId: "risk-engine", brokers: KAFKA_BROKERS });
let consumer: Consumer;
const dbClient = getDbClient();

// --- Logging Utility ---
const log = (level: string, message: string, context: Record<string, unknown> = {}) => {
  console.log(JSON.stringify({ level, message, service: "risk-engine", timestamp: new Date().toISOString(), ...context }));
};

// --- TODO: Implement Risk Score Computation ---
// Use the @chargeflow/risk-signals package to compute risk scores
// Available functions:
//   - ipVelocityScore(ip, recentIps)
//   - deviceReuseScore(fingerprint, knownDevices)
//   - emailDomainReputationScore(email)
//   - binCountryMismatchScore(binCountry, billingCountry)
//   - chargebackHistoryScore(merchantId, customerId)
// Each returns 0-20, aggregate into 0-100 score

// --- TODO: Implement Kafka Message Processing ---
const processKafkaMessage = async ({ topic, partition, message }: EachMessagePayload) => {
  const messageValue = message.value?.toString();
  if (!messageValue) {
    log('warn', 'Received null or empty message value', { topic, partition });
    return;
  }

  // TODO: Implement event processing
  // 1. Parse and validate the message using Zod schemas (OrderCreatedEventSchema, PaymentAuthorizedEventSchema)
  // 2. Handle OrderCreatedEvent:
  //    - Extract order data (orderId, transactionId, amount, email, billingCountry, etc.)
  //    - Store order context in database
  //    - Compute initial risk score
  // 3. Handle PaymentAuthorizedEvent:
  //    - Correlate to existing order by orderId
  //    - Update risk score with payment data (binCountry for country mismatch)
  //    - Handle out-of-order: what if payment arrives before order?
  // 4. Ensure idempotency (duplicate events should not corrupt state)
  // 5. Use correlation IDs for tracing

  log('info', 'Received message - processing not yet implemented', { topic, partition });
};

// --- HTTP Server Setup (Health Check + API) ---
const server = http.createServer(async (req, res) => {
  // Health check endpoint
  if (req.url === "/health" && req.method === "GET") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // TODO: Implement REST API endpoint
  // GET /risk-scores/{merchantId}/{orderId}
  //
  // Requirements:
  // - Validate path parameters
  // - Query database for risk score
  // - Return appropriate status: FOUND, EXPIRED, NOT_FOUND
  // - Include: riskScore, reasons[], computedAt, expiresAt
  // - Proper HTTP status codes (200, 400, 404, 500)
  // - Consistent error response format
  //
  // Consider:
  // - OpenAPI/Swagger documentation
  // - Request validation with Zod
  // - Correlation ID in responses for tracing

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

// --- Main Execution Flow ---
const run = async () => {
  await initDb();
  log('info', 'Database initialized.');

  consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_ORDER_CREATED, fromBeginning: true });
  await consumer.subscribe({ topic: TOPIC_PAYMENT_AUTHORIZED, fromBeginning: true });

  await consumer.run({
    eachMessage: processKafkaMessage,
  });

  log('info', `Kafka consumer connected and subscribed to topics: ${TOPIC_ORDER_CREATED}, ${TOPIC_PAYMENT_AUTHORIZED}`);

  server.listen(port, () => {
    log('info', `risk-engine listening on ${port}`);
  });
};

// --- Graceful Shutdown ---
const shutdown = async () => {
  log('info', "risk-engine shutting down");
  try {
    if (consumer) await consumer.disconnect();
    await dbClient.end();
    log('info', 'Kafka consumer and DB client disconnected.');
    server.close(() => process.exit(0));
  } catch (error) {
    log('error', 'Error during graceful shutdown', { error });
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

run().catch((err) => {
  log('fatal', 'Risk-engine fatal error', { error: err });
  process.exit(1);
});
