import { z } from "zod";

// --- Base Event Schema (CloudEvents-inspired envelope) ---
const BaseEventSchema = z.object({
	id: z.string().uuid(), // Unique ID for the event
	source: z.string(), // Identifies the context in which the event happened (e.g., "com.chargeflow.event-generator")
	type: z.string(), // Describes the type of event (e.g., "order.created", "payment.authorized", "dispute.opened")
	specversion: z.literal("1.0"), // CloudEvents specification version
	time: z.string().datetime(), // Timestamp of when the event occurred, in ISO 8601 format
	correlationId: z.string().uuid().optional(), // ID for tracing events across services
});

// --- Data Payloads ---

// Original: orders.v1
// eventType: "order.created"
// order_id: "ord_92b1fa1e"
// txnId: "txn_3e7d9a12"
// amt: 119.99
// currency: "USD"
// email: "alice@gmail.com"
// billing_country: "US"
// ts: 1736913435123 (unix ms)

export const OrderCreatedDataSchema = z.object({
	orderId: z.string(),
	transactionId: z.string(), // Renamed from txnId for consistency
	amount: z.number().positive(), // Renamed from amt
	currency: z.string().length(3),
	email: z.string().email(),
	billingCountry: z.string().length(2), // Renamed from billing_country
});

// Original: payments.v1
// eventType: "payment.done"
// orderId: "ord_92b1fa1e"
// payment_id: "pay_1b2c3d4e"
// amt: 119.99
// currency: "USD"
// binCountry: "CA"
// createdAt: "2026-01-15T12:23:45.123Z"

export const PaymentAuthorizedDataSchema = z.object({
	orderId: z.string(),
	paymentId: z.string(), // Renamed from payment_id
	amount: z.number().positive(), // Renamed from amt
	currency: z.string().length(3),
	binCountry: z.string().length(2),
});

// Original: disputes.v1
// eventType: "dispute"
// order_id: "ord_92b1fa1e"
// reason_code: "FRAUD"
// amt: 119.99
// openedAt: "2026-01-15T12:25:02.501Z"
// note: "customer says no"

export const DisputeOpenedDataSchema = z.object({
	orderId: z.string(),
	reasonCode: z.enum(["FRAUD", "NOT_RECEIVED", "DUPLICATE"]), // Renamed from reason_code
	amount: z.number().positive(), // Renamed from amt
	note: z.string().optional(),
});

// --- Full Event Schemas with Envelope ---

export const OrderCreatedEventSchema = BaseEventSchema.extend({
	type: z.literal("com.chargeflow.order.created"),
	data: OrderCreatedDataSchema,
});

export const PaymentAuthorizedEventSchema = BaseEventSchema.extend({
	type: z.literal("com.chargeflow.payment.authorized"),
	data: PaymentAuthorizedDataSchema,
});

export const DisputeOpenedEventSchema = BaseEventSchema.extend({
	type: z.literal("com.chargeflow.dispute.opened"),
	data: DisputeOpenedDataSchema,
});

// --- Export a union type for all events ---
export const AppEventSchema = z.discriminatedUnion("type", [
	OrderCreatedEventSchema,
	PaymentAuthorizedEventSchema,
	DisputeOpenedEventSchema,
]);

export type AppEvent = z.infer<typeof AppEventSchema>;
export type OrderCreatedEvent = z.infer<typeof OrderCreatedEventSchema>;
export type PaymentAuthorizedEvent = z.infer<
	typeof PaymentAuthorizedEventSchema
>;
export type DisputeOpenedEvent = z.infer<typeof DisputeOpenedEventSchema>;
