// TODO: Import event schemas from @chargeflow/contracts for validation
// import { DisputeOpenedEventSchema } from "@chargeflow/contracts";

import http from "node:http";
import { type Consumer, type EachMessagePayload, Kafka } from "kafkajs";
import { getDbClient, initDb } from "./db";

// --- Configuration ---
const port = Number(process.env.PORT ?? "3002");
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",");
const TOPIC_DISPUTE_OPENED = process.env.TOPIC_DISPUTES ?? "disputes.v1";
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID ?? "dispute-responder-group";
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- TODO: Use this to fetch risk scores from risk-engine
const RISK_ENGINE_API_URL = process.env.RISK_ENGINE_URL ?? "http://localhost:3001";

// --- Kafka Setup ---
const kafka = new Kafka({ clientId: "dispute-responder", brokers: KAFKA_BROKERS });
let consumer: Consumer;
const dbClient = getDbClient();

// --- Logging Utility ---
const log = (level: string, message: string, context: Record<string, unknown> = {}) => {
  console.log(JSON.stringify({ level, message, service: "dispute-responder", timestamp: new Date().toISOString(), ...context }));
};

// --- TODO: Implement Risk Score Fetching ---
// Create a helper to fetch risk scores from the risk-engine API
// Consider:
// - Retry logic for transient failures
// - Handling out-of-order events (dispute arrives before order/payment processed)
// - Timeout handling
// - Error responses from risk-engine

// --- TODO: Implement Kafka Message Processing ---
const processKafkaMessage = async ({ topic, partition, message }: EachMessagePayload) => {
  const messageValue = message.value?.toString();
  if (!messageValue) {
    log('warn', 'Received null or empty message value', { topic, partition });
    return;
  }

  // TODO: Implement dispute event processing
  // 1. Parse and validate the message using Zod schema (DisputeOpenedEventSchema)
  // 2. Extract dispute data (orderId, reasonCode, amount, etc.)
  // 3. Fetch risk score from risk-engine API
  //    - Handle case where risk score doesn't exist yet (out-of-order)
  //    - Consider retry mechanism with backoff
  // 4. Determine recommended action based on risk score:
  //    - FIGHT: low risk score (legitimate transaction)
  //    - REFUND_NOW: high risk score (likely fraud)
  //    - REVIEW: medium risk or missing data
  // 5. Build evidence bundle with:
  //    - Dispute details
  //    - Risk score and reasons
  //    - Order/payment context
  //    - Timestamps
  // 6. Store recommendation in database
  // 7. Ensure idempotency (duplicate disputes should not create duplicate records)
  // 8. Use correlation IDs for tracing

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
  // GET /recommendations/{merchantId}/{transactionId}
  //
  // Requirements:
  // - Validate path parameters
  // - Query database for recommendation
  // - Return: status, recommendedAction, evidenceBundle, computedAt
  // - Proper HTTP status codes (200, 400, 404, 500)
  // - Consistent error response format
  //
  // Consider:
  // - OpenAPI/Swagger documentation
  // - Request validation with Zod
  // - Correlation ID in responses for tracing
  // - How to map transactionId to orderId (clarify data model)

  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

// --- Main Execution Flow ---
const run = async () => {
  await initDb();
  log('info', 'Database initialized.');

  consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });
  await consumer.connect();
  await consumer.subscribe({ topic: TOPIC_DISPUTE_OPENED, fromBeginning: true });

  await consumer.run({
    eachMessage: processKafkaMessage,
  });

  log('info', `Kafka consumer connected and subscribed to topic: ${TOPIC_DISPUTE_OPENED}`);

  server.listen(port, () => {
    log('info', `dispute-responder listening on ${port}`);
  });
};

// --- Graceful Shutdown ---
const shutdown = async () => {
  log('info', "dispute-responder shutting down");
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
  log('fatal', 'Dispute-responder fatal error', { error: err });
  process.exit(1);
});
