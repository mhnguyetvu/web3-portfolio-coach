# Web3 Portfolio Coach (MVP)

A lightweight Web3 portfolio coach that analyzes a seeded demo wallet snapshot and returns **responsible**, rule-based insights (no buy/sell signals, no price predictions).  
Built for a hackathon checkpoint with emphasis on **functionality + observability**.

---

## Live Demo
Recommended:
- Docs (Swagger UI): https://chromophoric-unmineralized-norris.ngrok-free.dev/docs
- Health check: https://chromophoric-unmineralized-norris.ngrok-free.dev/health
- Portfolio demo: https://chromophoric-unmineralized-norris.ngrok-free.dev/portfolio/demo

---

## What it does (Checkpoint MVP)

### ✅ Core endpoints
- **GET `/health`**  
  Health check to confirm the service is running.

- **GET `/portfolio/demo`**  
  Returns a seeded demo wallet snapshot + deterministic quant metrics:
  - total USD value
  - concentration (top1/top5 %)
  - stablecoin ratio (%)

- **POST `/chat`**  
  Chat-style endpoint that turns portfolio metrics into a short action checklist.
  - grounded on deterministic metrics (no hallucinated numbers)
  - includes safety guardrails (no buy/sell signals, no price predictions)

### ✅ Premium stub
- **GET `/premium/report`**  
  A “deep report” stub with a simple drawdown scenario. Planned to be paywalled later (x402).

### ✅ Observability (Opik)
- Each `/chat` request is traced in **Opik** with:
  - a top-level trace: **`chat_request`**
  - a nested span for quant computation: **`compute_metrics`**
  - tags/metadata for filtering (e.g., `checkpoint2`, `chat`, `mvp`, `quant`)

---

## Tech Stack
- FastAPI + Uvicorn
- Deterministic “quant tools” (pure Python)
- Opik tracing for observability

---


