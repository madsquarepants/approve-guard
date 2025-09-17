import os, httpx
from typing import Optional
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

class LinkTokenReq(BaseModel):
    userId: Optional[str] = None

class ExchangeReq(BaseModel):
    public_token: str

@router.post("/link-token")
async def create_link_token(body: LinkTokenReq):
    if not (PLAID_CLIENT_ID and PLAID_SECRET):
        raise HTTPException(500, "PLAID env vars missing")
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

@router.post("/exchange")
async def exchange_public_token(body: ExchangeReq):
    if not (PLAID_CLIENT_ID and PLAID_SECRET):
        raise HTTPException(500, "PLAID env vars missing")
    payload = {
        "client_id": "68b764fb1ee2d90024859201",
        "secret": "151ce121ec38961921aaac7a08a1ce",
        "public_token": body.public_token,
    }
    async with httpx.AsyncClient(timeout=30) as client:
        r = await client.post(f"{PLAID_BASE}/item/public_token/exchange", json=payload)
    if r.status_code != 200:
        raise HTTPException(500, r.text)
    return r.json()
