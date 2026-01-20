# Chargeflow Senior Backend Take-Home Assignment

## Mini Risk Engine + Dispute Responder

Welcome! Thanks for taking the time to work on this take-home assignment.

This exercise is intentionally **small** but designed to reflect how we build production backend systems: event-driven microservices, Kafka, TypeScript/Node.js, containerized local dev, and clean API design.

|                    |                                                                              |
| ------------------ | ---------------------------------------------------------------------------- |
| **Estimated time** | 2-4 hours                                                                    |
| **Language**       | TypeScript (Node.js)                                                         |
| **Required**       | Kafka, Docker                                                                |
| **Your choice**    | API technology (REST/gRPC/other), schema validation approach, frontend stack |

---

## Important: This Starter is Intentionally Rough

**This is not a "fill in the blanks" assignment.**

The starter code contains intentional issues that a senior engineer should identify and improve. Part of your evaluation is based on:

1. **What problems you identify** in the existing code
2. **How you fix them** with production-ready patterns
3. **Why you made those choices** (documented in your README)

Examples of things you might want to improve:

- Topic and event naming conventions
- Schema validation (or lack thereof)
- Field naming consistency
- Timestamp formats
- Correlation/tracing patterns
- Anything else you'd flag in a code review

---

## Background (Chargeflow Domain, Simplified)

Chargeflow helps eCommerce merchants reduce disputes and fight chargebacks. In the real system, we:

- **Score purchases** shortly after checkout (Prevent)
- **Handle pre-dispute signals** (Alert)
- **Assemble evidence** for open chargebacks (Chargeback Automation)

For this assignment, you'll build a tiny slice of Prevent + Alert:

1. When an order/payment event arrives → compute a risk score
2. When a dispute alert arrives later → correlate it to the original order/payment → return a recommended action and evidence bundle

---

## The Challenge

Implement **two microservices** and **one frontend**:

### Service A: `risk-engine`

- Consumes order and payment events from Kafka
- Computes a risk score using the provided `risk-signals` package
- Stores the risk score with metadata
- Exposes an API to query risk scores

### Service B: `dispute-responder`

- Consumes dispute/alert events from Kafka
- Correlates disputes to stored order/payment/risk data
- Determines a recommended action
- Exposes an API to query recommendations with evidence

### Service C: `frontend` (new)

- Build a simple web UI from scratch (stack of your choice)
- Run it via `docker-compose` (or another runnable environment you document)
- Integrate with the `risk-engine` + `dispute-responder` APIs
- Use the UI to surface and validate a clean, consistent API/REST design

---

## What We Provide

### 1. Local Infrastructure (Docker Compose)

- Kafka (Redpanda) + UI for debugging
- MongoDB and PostgreSQL (you choose which to use)
- A working event generator that publishes events

### 2. Risk Signal Functions (`packages/risk-signals`)

A package with 5 deterministic scoring helpers:

```typescript
ipVelocityScore(ip, recentIps)           // 0-20
deviceReuseScore(fingerprint, known)      // 0-20
emailDomainReputationScore(email)         // 0-20
binCountryMismatchScore(bin, billing)     // 0-20
chargebackHistoryScore(merchant, customer) // 0-20
```

You orchestrate these; you don't need to invent fraud logic.

### 3. Sample Event Payloads

See `docs/event-examples.md` for the current event formats.

**Note:** These events are intentionally rough. Improving them is part of the assignment.

---

## Requirements

### Kafka (Required)

Your services must:

- [ ] Consume from Kafka using consumer groups
- [ ] Tolerate at-least-once delivery (duplicates can happen)
- [ ] Be resilient to out-of-order events (e.g., dispute arrives before order)
- [ ] Include a retry strategy (document what you'd do for DLQs in production)

**Minimum expectation:** No state corruption if the same event is processed twice.

### Risk Scoring (Required)

`risk-engine` must compute and store:

- `merchantId`, `orderId`
- `riskScore` (0-100, aggregated from the signal functions)
- `reasons[]` (top contributing signals)
- `computedAt`
- `expiresAt` (score expires after 15 minutes unless refreshed)

If a score is expired, your API should indicate this clearly.

### Correlation + Evidence (Required)

`dispute-responder` receives only:
- `merchantId`
- `transactionId`

It must:

1. Look up the transaction → map to `orderId`
2. Load order/payment context + latest risk score
3. Produce:
   - `recommendedAction`: `REFUND_NOW` | `FIGHT` | `REVIEW`
   - `evidenceBundle`: structured object with key facts (timestamps, amount, AVS/CVV, risk reasons, etc.)

### REST API (Required)

You must expose a **production-quality REST API** for both services:

- Well-structured, RESTful endpoints
- Proper HTTP methods and status codes
- Request/response validation
- Consistent error response format
- API documentation (OpenAPI/Swagger)

**Operations to implement:**

| Operation              | Input                         | Output                                                       |
| ---------------------- | ----------------------------- | ------------------------------------------------------------ |
| Get Risk Score         | `merchantId`, `orderId`       | score, reasons, timestamps, status (FOUND/EXPIRED/NOT_FOUND) |
| Get Recommended Action | `merchantId`, `transactionId` | action, evidence bundle, status                              |

### Frontend (Required)

Your frontend must:

- [ ] Run locally in a container (preferably via `docker compose up --build`)
- [ ] Provide two screens/forms:
  - [ ] **Risk Score Lookup**: input `merchantId` + `orderId` → call the `risk-engine` API and render `status`, score, reasons, timestamps
  - [ ] **Recommendation Lookup**: input `merchantId` + `transactionId` → call the `dispute-responder` API and render `status`, action, and evidence bundle
- [ ] Handle and display error states (404/validation/500) in a user-friendly way
- [ ] Keep a small API client layer (don’t sprinkle `fetch` everywhere)
- [ ] Include at least a couple tests (API client + one UI component)

### Contract/Schema Validation (Required - Your Choice)

Events and API payloads must be validated. **Choose your approach:**

- Zod
- JSON Schema
- Protobuf
- Avro
- Other

Document why you chose your approach.

---

## Non-Functional Requirements

Keep it lightweight, but demonstrate production thinking:

- [ ] Clear folder structure, readable code
- [ ] Structured logging with correlation IDs (`eventId`, `merchantId`, `orderId`, `transactionId`)
- [ ] Graceful startup/shutdown
- [ ] Configuration via environment variables
- [ ] Health check endpoint (`GET /health`)

---

## Deliverables

### 1. Code (this repo)

- [ ] `risk-engine` service - fully implemented
- [ ] `dispute-responder` service - fully implemented
- [ ] Dockerfiles + `docker compose up` works end-to-end
- [ ] Frontend runs end-to-end and integrates with both APIs

### 2. README Updates

Add a section to this README (or create `SOLUTION.md`) covering:

- [ ] **How to run it** - any setup beyond `docker compose up`
- [ ] **What you improved** - list changes to naming, schemas, structure and WHY
- [ ] **Technical decisions:**
  - API choice (REST/gRPC/other) and why
  - Schema validation approach and why
  - Database choice (Mongo/Postgres) and why
  - Kafka patterns (keys, partitions, consumer groups)
  - How you handle duplicates & out-of-order events
- [ ] **Data model** - your storage schema
- [ ] **What you'd do differently** in AWS/EKS for production
- [ ] **How to test it** (including API/contract tests and any frontend tests)

### 3. Event Flow Diagram

Include a simple diagram (ASCII, Mermaid, Draw.io, Eraser, Lucidchart, or image) showing:

- Event flow through the system
- Where data is stored
- API query paths

---

## Bonus (Optional)

Pick any if you have time:

- [ ] DLQ topic + dead letter handling
- [ ] Integration tests (compose + happy path)
- [ ] Metrics endpoint (Prometheus)
- [ ] Kubernetes manifests (Kind/k3d)
- [ ] "Pending correlation" - dispute arrives before order → PENDING state until data arrives

---

## Quick Start

```bash
# Copy environment config
cp env.example .env

# Start everything
docker compose up --build
```

Then:

- Event generator publishes events to Kafka
- Your services consume and process
- Query your APIs to verify

### Useful URLs (after `docker compose up`)

| Service                     | URL                   |
| --------------------------- | --------------------- |
| Redpanda Console (Kafka UI) | http://localhost:8080 |
| MongoDB                     | localhost:27017       |
| PostgreSQL                  | localhost:5432        |

---

## Sample Happy Path

What should happen when everything works:

1. `OrderCreated` event published (orderId: `order-123`)
2. `TransactionAuthorized` event published (txnId: `txn-456`, links to `order-123`)
3. `risk-engine` computes and stores risk score for `order-123`
4. `DisputeOpened` event published (references `txn-456`)
5. `dispute-responder` correlates, decides action, stores decision
6. API call: `GetRecommendedAction(merchantId, txn-456)` returns action + evidence

---

## Questions?

If something is unclear, make a reasonable assumption and document it. We value seeing how you think through ambiguity.

For further help, please reach out.

---

## Submission Instructions (Important)

- Make a **private clone/fork** of this repo and add **`moshem-cf`** as a collaborator.
- Work in **small, logical commits** (like a normal day of engineering): e.g. `chore: ...`, `feat: ...`, `test: ...`, `docs: ...`.
- Add tests incrementally as you implement changes (not only at the end).

## Your Solution

<!-- Add your documentation below this line -->
