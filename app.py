from fastapi import FastAPI

app = FastAPI(title="Web3 Portfolio Coach (MVP)")

DEMO_PORTFOLIO = [
    {"symbol": "ETH", "type": "crypto", "value_usd": 4200, "chain": "Ethereum"},
    {"symbol": "USDC", "type": "stablecoin", "value_usd": 1800, "chain": "Base"},
    {"symbol": "SOL", "type": "crypto", "value_usd": 1200, "chain": "Solana"},
    {"symbol": "ARB", "type": "crypto", "value_usd": 600, "chain": "Arbitrum"},
    {"symbol": "NFT-ABC", "type": "nft", "value_usd": 400, "chain": "Ethereum"},
]

def total_value(positions):
    return float(sum(p["value_usd"] for p in positions))

def concentration(positions):
    tv = total_value(positions) or 1.0
    sorted_pos = sorted(positions, key=lambda x: x["value_usd"], reverse=True)
    top1 = sorted_pos[0]["value_usd"] / tv * 100
    top5 = sum(p["value_usd"] for p in sorted_pos[:5]) / tv * 100
    return {"top1_pct": round(top1, 2), "top5_pct": round(top5, 2)}

def stable_ratio(positions):
    tv = total_value(positions) or 1.0
    stable = sum(p["value_usd"] for p in positions if p["type"] == "stablecoin")
    return {"stable_pct": round(stable / tv * 100, 2)}

@app.get("/health")
def health():
    return {"ok": True, "service": "web3-portfolio-coach-mvp"}

@app.get("/portfolio/demo")
def portfolio_demo():
    positions = DEMO_PORTFOLIO
    return {
        "wallet": "0xDEMO_WALLET",
        "positions": positions,
        "metrics": {
            "total_usd": round(total_value(positions), 2),
            "concentration": concentration(positions),
            "stable_ratio": stable_ratio(positions),
        },
        "note": "MVP uses seeded demo data. Next: LangGraph agent + x402 premium endpoint + Opik tracing.",
    }
