# Raw Event Samples (Intentionally Messy)

These are example payloads coming from the starter event generator.
They are intentionally inconsistent and lack schema validation.

## orders.v1

```json
{
  "eventType": "order.created",
  "order_id": "ord_92b1fa1e",
  "txnId": "txn_3e7d9a12",
  "amt": 119.99,
  "currency": "USD",
  "email": "alice@gmail.com",
  "billing_country": "US",
  "ts": 1736913435123
}
```

## payments.v1

```json
{
  "eventType": "payment.done",
  "orderId": "ord_92b1fa1e",
  "payment_id": "pay_1b2c3d4e",
  "amt": 119.99,
  "currency": "USD",
  "binCountry": "CA",
  "createdAt": "2026-01-15T12:23:45.123Z"
}
```

## disputes.v1

```json
{
  "eventType": "dispute",
  "order_id": "ord_92b1fa1e",
  "reason_code": "FRAUD",
  "amt": 119.99,
  "openedAt": "2026-01-15T12:25:02.501Z",
  "note": "customer says no"
}
```
