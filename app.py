import time
import uuid
from dotenv import load_dotenv

# Load .env as early as possible (for OPIK_* env vars, etc.)
load_dotenv()

from fastapi import FastAPI
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from opik import track

app = FastAPI(title="Web3 Portfolio Coach (MVP)")

# -----------------------------
# Seeded demo portfolio data
# -----------------------------
DEMO_PORTFOLIO = [
    {"symbol": "ETH", "type": "crypto", "value_usd": 4200, "chain": "Ethereum"},
    {"symbol": "USDC", "type": "stablecoin", "value_usd": 1800, "chain": "Base"},
    {"symbol": "SOL", "type": "crypto", "value_usd": 1200, "chain": "Solana"},
    {"symbol": "ARB", "type": "crypto", "value_usd": 600, "chain": "Arbitrum"},
    {"symbol": "NFT-ABC", "type": "nft", "value_usd": 400, "chain": "Ethereum"},
]

# -----------------------------
# Deterministic "quant" helpers
# -----------------------------
def total_value(positions):
    return float(sum(p["value_usd"] for p in positions))

def concentration(positions):
    tv = total_value(positions) or 1.0
    sorted_pos = sorted(positions, key=lambda x: x["value_usd"], reverse=True)
    top1 = (sorted_pos[0]["value_usd"] / tv * 100) if sorted_pos else 0.0
    top5 = (sum(p["value_usd"] for p in sorted_pos[:5]) / tv * 100) if sorted_pos else 0.0
    return {"top1_pct": round(top1, 2), "top5_pct": round(top5, 2)}

def stable_ratio(positions):
    tv = total_value(positions) or 1.0
    stable = sum(p["value_usd"] for p in positions if p["type"] == "stablecoin")
    return {"stable_pct": round(stable / tv * 100, 2)}

def build_action_checklist(metrics: dict) -> list[str]:
    advice = []
    conc = metrics["concentration"]["top1_pct"]
    stable = metrics["stable_ratio"]["stable_pct"]

    if conc > 40:
        advice.append("High concentration: consider capping any single asset to ~25–35% to reduce risk.")
    else:
        advice.append("Concentration looks reasonable; keep monitoring your top holdings.")

    if stable < 10:
        advice.append("Low stablecoin buffer: consider keeping 10–25% in stablecoins for drawdown resilience / upcoming expenses.")
    else:
        advice.append("Stablecoin buffer exists; align it with your risk tolerance and upcoming cash needs.")

    advice.append("Fee hygiene: batch transactions and avoid frequent small swaps when possible.")
    advice.append("Safety: I don’t provide buy/sell signals or price predictions; focus on diversification and cash buffers.")
    return advice

# -----------------------------
# Opik-traced functions
# -----------------------------
@track(
    name="compute_metrics",
    type="tool",
    tags=["mvp", "quant"],
    capture_input=False,   # don't log full positions (optional)
    capture_output=True,
)
def compute_metrics(positions):
    return {
        "total_usd": round(total_value(positions), 2),
        "concentration": concentration(positions),
        "stable_ratio": stable_ratio(positions),
    }

@track(
    name="chat_request",
    type="agent",
    tags=["checkpoint2", "chat"],
    metadata={"app": "web3-portfolio-coach", "mode": "seeded-demo"},
    capture_input=True,
    capture_output=True,
    flush=True,            # helps traces appear quickly in Opik UI
)
def run_chat_logic(user_message: str) -> dict:
    start = time.time()
    positions = DEMO_PORTFOLIO
    metrics = compute_metrics(positions)

    msg = user_message.lower()

    # lightweight safety guardrail
    if any(x in msg for x in ["should i buy", "what to buy", "pump", "moon", "price prediction", "signal"]):
        reply = (
            "I can’t provide buy/sell signals or price predictions. "
            "I can help you understand risk, diversification, stablecoin buffers, and fee hygiene."
        )
        return {
            "request_id": str(uuid.uuid4()),
            "latency_ms": int((time.time() - start) * 1000),
            "reply": reply,
        }

    if any(k in msg for k in ["summary", "portfolio", "analyze", "risk", "exposure"]):
        checklist = build_action_checklist(metrics)
        reply = {
            "summary": metrics,
            "action_checklist": checklist,
        }
    else:
        reply = "Try: 'summarize my portfolio' or 'analyze risk'. This MVP uses seeded demo data."

    return {
        "request_id": str(uuid.uuid4()),
        "latency_ms": int((time.time() - start) * 1000),
        "reply": reply,
    }

# -----------------------------
# API routes
# -----------------------------
@app.get("/")
def root():
    return RedirectResponse(url="/docs")

@app.get("/health")
def health():
    return {"ok": True, "service": "web3-portfolio-coach-mvp"}

@app.get("/portfolio/demo")
def portfolio_demo():
    positions = DEMO_PORTFOLIO
    metrics = compute_metrics(positions)
    return {
        "wallet": "0xDEMO_WALLET",
        "positions": positions,
        "metrics": metrics,
        "note": "MVP uses seeded demo data. Next: LangGraph agent + Opik eval dataset + x402 premium paywall.",
    }

class ChatIn(BaseModel):
    message: str

@app.post("/chat")
def chat(body: ChatIn):
    return run_chat_logic(body.message)

@app.get("/premium/report")
def premium_report():
    positions = DEMO_PORTFOLIO
    tv = total_value(positions)
    conc = concentration(positions)
    stable = stable_ratio(positions)

    # deterministic scenario: ETH -30%, SOL -40%
    shocked = 0.0
    for p in positions:
        v = float(p["value_usd"])
        if p["symbol"] == "ETH":
            v *= 0.70
        elif p["symbol"] == "SOL":
            v *= 0.60
        shocked += v

    delta = shocked - tv
    delta_pct = (delta / tv * 100) if tv else 0.0

    return {
        "deep_report": {
            "total_usd": round(tv, 2),
            "concentration": conc,
            "stable_ratio": stable,
            "scenario": {
                "ETH_-30_SOL_-40": {
                    "delta_usd": round(delta, 2),
                    "delta_pct": round(delta_pct, 2),
                }
            },
            "principles": [
                "Diversify to reduce single-asset risk (rule-based, no price predictions).",
                "Keep a stable buffer sized to your cash needs and risk tolerance.",
                "Minimize fees by batching and reducing churn.",
            ],
        }
    }
