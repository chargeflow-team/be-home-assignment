import test from "node:test";
import assert from "node:assert/strict";

// Minimal contract-ish tests for the starter API.
// These are meant to be run against a running service (e.g. via docker-compose).

const RISK_ENGINE_BASE_URL = process.env.RISK_ENGINE_BASE_URL ?? "http://localhost:3001";

test("GET /health returns ok", async () => {
  const res = await fetch(`${RISK_ENGINE_BASE_URL}/health`);
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.status, "ok");
});

test("GET /risk-score/:merchantId/:orderId returns NOT_FOUND for unknown ids", async () => {
  const res = await fetch(`${RISK_ENGINE_BASE_URL}/risk-score/test-merchant/test-order`);
  // Implementation may choose 404 for NOT_FOUND; this test enforces that.
  assert.equal(res.status, 404);
  const body = await res.json();
  assert.equal(body.status, "NOT_FOUND");
});

