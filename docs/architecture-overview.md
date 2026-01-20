# Architecture Overview

High-level data flow for the take-home:

1. `event-generator` publishes raw events to Kafka topics:
   - `orders.v1`
   - `payments.v1`
   - `disputes.v1`
2. `risk-engine` consumes order/payment events, correlates them, and computes a risk score.
3. `dispute-responder` consumes dispute events and asks the `risk-engine` for a recommended action.
4. Candidates can choose either MongoDB or PostgreSQL to persist state.

The goal is to improve the messy starter events by introducing proper naming, contracts, and production-ready patterns while implementing the services.
