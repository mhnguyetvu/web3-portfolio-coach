# Web3 Portfolio Coach (MVP)

A lightweight Web3 portfolio coach that analyzes a demo wallet snapshot and returns simple, responsible risk insights (no buy/sell signals).

## Live Demo
- Docs: https://YOUR_NGROK_URL/docs
- Health: https://YOUR_NGROK_URL/health
- Portfolio: https://YOUR_NGROK_URL/portfolio/demo
- Chat: https://YOUR_NGROK_URL/docs (POST /chat)

## Run locally
```bash
pip install -r requirements.txt
uvicorn app:app --reload --port 8000
