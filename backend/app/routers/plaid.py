# app/routers/plaid.py
import os
from datetime import date, timedelta
from typing import Optional

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(tags=["plaid"])

PLAID_ENV = os.getenv("PLAID_ENV", "sandbox").lower()
PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")

BASES = {
    "sandbox": "https://sandbox.plaid.com",
    "development": "https://development.plaid.com",
    "production": "https://production.plaid.com",
}
PLAID_BASE = BASES.get(PLAID_ENV, BASES["sandbox"])

# ----- simple in-memory storage (demo only; replace w/ DB per user) -----
ACCESS_TOKENS: dict[str, str] = {}  # key by user later; "demo" for now

class LinkTokenReq(BaseModel):
    userId: Optional[str] = None

class ExchangeReq(BaseModel):
    public_token: str

def _require_creds():
    if not (PLAID_CLIENT_ID and PLAID_SECRET):
        raise HTTPException(500, "PLAID_CLIENT_ID/PLAID_SECRET missing")

# ----- Create Link Token -----
@router.post("/link-token")
async def create_link_token(body: LinkTokenReq):
    _require_creds()
    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "client_name": "Approve Guard",
        "language": "en",
        "country_codes": ["US"],
        "user": {"client_user_id": body.userId or "anonymous"},
        "products": ["transactions"],
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{PLAID_BASE}/link/token/create", json=payload)
    if r.status_code != 200:
        raise HTTPException(500, r.text)
    return {"link_token": r.json().get("link_token")}

# ----- Exchange public_token for access_token -----
@router.post("/exchange")
async def exchange_public_token(body: ExchangeReq):
    _require_creds()
    payload = {
        "client_id": PLAID_CLIENT_ID,  # ✅ use env vars (no hardcoding)
        "secret": PLAID_SECRET,
        "public_token": body.public_token,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{PLAID_BASE}/item/public_token/exchange", json=payload)
    if r.status_code != 200:
        raise HTTPException(500, r.text)
    data = r.json()
    ACCESS_TOKENS["demo"] = data.get("access_token")  # store for demo
    return {"ok": True}

# ----- Get accounts for the linked item -----
@router.get("/accounts")
async def get_accounts():
    _require_creds()
    access_token = ACCESS_TOKENS.get("demo")
    if not access_token:
        raise HTTPException(400, "No access_token yet. Link a bank first.")

    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "access_token": access_token,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{PLAID_BASE}/accounts/get", json=payload)
    if r.status_code != 200:
        raise HTTPException(500, r.text)
    return {"accounts": r.json().get("accounts", [])}

# ----- Simple transactions (last 30 days) -----
@router.get("/transactions")
async def get_transactions():
    _require_creds()
    access_token = ACCESS_TOKENS.get("demo")
    if not access_token:
        raise HTTPException(400, "No access_token yet. Link a bank first.")

    end = date.today()
    start = end - timedelta(days=30)
    payload = {
        "client_id": PLAID_CLIENT_ID,
        "secret": PLAID_SECRET,
        "access_token": access_token,
        "start_date": start.isoformat(),
        "end_date": end.isoformat(),
        "options": {"count": 50, "offset": 0},
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{PLAID_BASE}/transactions/get", json=payload)
    if r.status_code != 200:
        raise HTTPException(500, r.text)
    j = r.json()
    return {
        "total": j.get("total_transactions", 0),
        "transactions": j.get("transactions", []),
        "accounts": j.get("accounts", []),
    }
