# Frontend (candidate-owned)

You will create a frontend from scratch (framework of your choice) and run it as part of the local environment.

## Requirements

- Your frontend must run in a container (preferably via `docker compose up --build`).
- It must call the backend APIs:
  - `risk-engine`: `GET http://risk-engine:3001/risk-score/{merchantId}/{orderId}`
  - `dispute-responder`: `GET http://dispute-responder:3002/recommendation/{merchantId}/{transactionId}`
- Add a small API client module (don’t call `fetch` directly from every component).
- Add at least a couple tests (API client + one UI component).

## Docker / compose notes

- Inside Docker Compose, services are reachable by their service name (e.g., `http://risk-engine:3001`).
- If you run the frontend outside Docker, call `http://localhost:3001` and `http://localhost:3002` instead.

## Suggested UI

- A simple dashboard with:
  - Risk Score lookup form
  - Recommendation lookup form
  - Render `FOUND/EXPIRED/NOT_FOUND` statuses and evidence bundle nicely

