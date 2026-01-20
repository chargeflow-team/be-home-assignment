import { v4 as uuidv4 } from "uuid";
import {
  OrderCreatedDataSchema,
  PaymentAuthorizedDataSchema,
  DisputeOpenedDataSchema,
  OrderCreatedEventSchema,
  PaymentAuthorizedEventSchema,
  DisputeOpenedEventSchema,
} from "@chargeflow/contracts";

const randomItem = <T>(list: T[]): T => list[Math.floor(Math.random() * list.length)];
const randomAmount = (): number => Number((Math.random() * 200 + 5).toFixed(2));

const emails = [
  "alice@gmail.com",
  "bob@corp.example",
  "fraudster@mailinator.com",
  "user@outlook.com",
];

const countries = ["US", "CA", "GB", "FR", "DE"];

const generateBaseEvent = (type: string, correlationId?: string) => ({
  id: uuidv4(),
  source: "com.chargeflow.event-generator",
  type,
  specversion: "1.0",
  time: new Date().toISOString(),
  correlationId: correlationId || uuidv4(),
});

export const buildOrderEvt = (correlationId?: string) => {
  const orderId = `ord_${uuidv4().slice(0, 8)}`;
  const eventData: OrderCreatedDataSchema = {
    orderId: orderId,
    transactionId: `txn_${uuidv4().slice(0, 8)}`,
    amount: randomAmount(),
    currency: "USD",
    email: randomItem(emails),
    billingCountry: randomItem(countries),
  };
  return OrderCreatedEventSchema.parse({
    ...generateBaseEvent("com.chargeflow.order.created", correlationId),
    data: eventData,
  });
};

export const buildPaymentEvt = (orderId?: string, correlationId?: string) => {
  const eventData: PaymentAuthorizedDataSchema = {
    orderId: orderId ?? `ord_${uuidv4().slice(0, 8)}`,
    paymentId: `pay_${uuidv4().slice(0, 8)}`,
    amount: randomAmount(),
    currency: "USD",
    binCountry: randomItem(countries),
  };
  return PaymentAuthorizedEventSchema.parse({
    ...generateBaseEvent("com.chargeflow.payment.authorized", correlationId),
    data: eventData,
  });
};

export const buildDisputeEvt = (orderId?: string, correlationId?: string) => {
  const eventData: DisputeOpenedDataSchema = {
    orderId: orderId ?? `ord_${uuidv4().slice(0, 8)}`,
    reasonCode: randomItem(["FRAUD", "NOT_RECEIVED", "DUPLICATE"]),
    amount: randomAmount(),
    note: "customer says no",
  };
  return DisputeOpenedEventSchema.parse({
    ...generateBaseEvent("com.chargeflow.dispute.opened", correlationId),
    data: eventData,
  });
};
