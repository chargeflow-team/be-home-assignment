import { Kafka } from "kafkajs";
import { v4 as uuidv4 } from "uuid";
import { buildDisputeEvt, buildOrderEvt, buildPaymentEvt } from "./events";
import { AppEvent } from "@chargeflow/contracts"; // Import AppEvent for type safety

const brokers = (process.env.KAFKA_BROKERS ?? "localhost:9092").split(",");
const TOPIC_ORDERS = process.env.TOPIC_ORDERS ?? "com.chargeflow.events.order.created";
const TOPIC_PAYMENTS = process.env.TOPIC_PAYMENTS ?? "com.chargeflow.events.payment.authorized";
const TOPIC_DISPUTES = process.env.TOPIC_DISPUTES ?? "com.chargeflow.events.dispute.opened";
const EVENT_INTERVAL_MS = Number(process.env.EVENT_INTERVAL_MS ?? "5000");
const ENABLE_DUPLICATES = (process.env.ENABLE_DUPLICATES ?? "true") === "true";
const DUPLICATE_RATE = Number(process.env.DUPLICATE_RATE ?? "0.1");
const ENABLE_OUT_OF_ORDER = (process.env.ENABLE_OUT_OF_ORDER ?? "true") === "true";

const kafka = new Kafka({ clientId: "chargeflow-event-generator", brokers });
const producer = kafka.producer();

const sentCache: Array<{ topic: string; value: string }> = [];

const sendEvt = async (topic: string, payload: AppEvent) => {
  const value = JSON.stringify(payload);
  await producer.send({
    topic,
    messages: [{ value, key: payload.id }], // Use event ID as key for ordering within partitions
  });
  sentCache.push({ topic, value });
  if (sentCache.length > 50) sentCache.shift();
};

const maybeDuplicate = async () => {
  if (!ENABLE_DUPLICATES || sentCache.length === 0) return;
  if (Math.random() > DUPLICATE_RATE) return;

  const dup = sentCache[Math.floor(Math.random() * sentCache.length)];
  await producer.send({
    topic: dup.topic,
    messages: [{ value: dup.value }],
  });
};

const emitBundle = async () => {
  const correlationId = uuidv4(); // Generate a single correlationId for the bundle
  const order = buildOrderEvt(correlationId);
  const payment = buildPaymentEvt(order.data.orderId, correlationId);
  const dispute = buildDisputeEvt(order.data.orderId, correlationId);

  const stack: Array<{ topic: string; payload: AppEvent }> = [
    { topic: TOPIC_ORDERS, payload: order },
    { topic: TOPIC_PAYMENTS, payload: payment },
    { topic: TOPIC_DISPUTES, payload: dispute },
  ];

  if (ENABLE_OUT_OF_ORDER && Math.random() < 0.2) {
    // If out-of-order is enabled, swap order and payment events
    const tmp = stack[0];
    stack[0] = stack[1];
    stack[1] = tmp;
  }

  for (const item of stack) {
    await sendEvt(item.topic, item.payload);
  }

  await maybeDuplicate();
};

const run = async () => {
  await producer.connect();
  console.log("chargeflow-event-generator connected", { brokers });

  setInterval(() => {
    emitBundle().catch((err) => console.error("emit error", err));
  }, EVENT_INTERVAL_MS);
};

run().catch((err) => {
  console.error("fatal", err);
  process.exit(1);
});
