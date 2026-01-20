import test from "node:test";
import assert from "node:assert/strict";

// Minimal contract-ish tests for the starter API.
// These are meant to be run against a running service (e.g. via docker-compose).

const DISPUTE_RESPONDER_BASE_URL =
  process.env.DISPUTE_RESPONDER_BASE_URL ?? "http://localhost:3002";

test("GET /health returns ok", async () => {
  const res = await fetch(`${DISPUTE_RESPONDER_BASE_URL}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
});

test("GET /recommendation/:merchantId/:transactionId returns NOT_FOUND for unknown ids", async () => {
  const res = await fetch(
    `${DISPUTE_RESPONDER_BASE_URL}/recommendation/test-merchant/test-transaction`
  );
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.status, "NOT_FOUND");
});

