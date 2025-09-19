# app/routers/plaid.py
import os
from datetime import date, timedelta
from typing import Optional, Dict

import httpx
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

# This router is mounted in main.py with: app.include_router(plaid.router, prefix="/v1/plaid")
router = APIRouter(tags=["plaid"])

# --- Config ---
PLAID_ENV = os.getenv("PLAID_ENV", "sandbox").lower()
PLAID_CLIENT_ID = os.getenv("PLAID_CLIENT_ID")
PLAID_SECRET = os.getenv("PLAID_SECRET")

_BASES = {
    "sandbox": "https://sandbox.plaid.com",
    "development": "https://development.plaid.com",
    "production": "https://production.plaid.com",
}
PLAID_BASE = _BASES.get(PLAID_ENV, _BASES["sandbox"])

# --- Demo storage (replace with DB per user later) ---
ACCESS_TOKENS: Dict[str, str] = {}  # key by user; we use "demo" for now


# --- Models ---
class LinkTokenReq(BaseModel):
    userId: Optional[str] = None  # optional: lets you key tokens per-user later


class ExchangeReq(BaseModel):
    public_token: str
    userId: Optional[str] = None  # optional: store per-user later


# --- Helpers ---
def _require_creds():
    if not (PLAID_CLIENT_ID and PLAID_SECRET):
        raise HTTPException(status_code=500, detail="PLAID_CLIENT_ID/PLAID_SECRET missing")


def _key(user_id: Optional[str]) -> str:
    return user_id or "demo"


async def _plaid_post(path: str, payload: dict) -> httpx.Response:
    """POST to a Plaid endpoint with a fresh client."""
    async with httpx.AsyncClient(timeout=30) as client:
        return await client.post(f"{PLAID_BASE}{path}", json=payload)


# --- Endpoints ---
@router.post("/link-token")
async def create_link_token(body: LinkTokenReq):
    """Create a Plaid Link token."""
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
    r = await _plaid_post("/link/token/create", payload)
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    token = r.json().get("link_token")
    if not token:
        raise HTTPException(status_code=500, detail="Missing link_token in Plaid response")
    return {"link_token": token}


@router.post("/exchange")
async def exchange_public_token(body: ExchangeReq):
    """Exchange public_token for access_token and store it (demo)."""
    _require_creds()
    r = await _plaid_post(
        "/item/public_token/exchange",
        {
            "client_id": PLAID_CLIENT_ID,
            "secret": PLAID_SECRET,
            "public_token": body.public_token,
        },
    )
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    access_token = r.json().get("access_token")
    if not access_token:
        raise HTTPException(status_code=500, detail="Missing access_token in Plaid response")
    ACCESS_TOKENS[_key(body.userId)] = access_token
    return {"ok": True}


@router.get("/accounts")
async def get_accounts(userId: Optional[str] = None):
    """Return accounts for the linked item."""
    _require_creds()
    access_token = ACCESS_TOKENS.get(_key(userId))
    if not access_token:
        raise HTTPException(status_code=400, detail="No access_token yet. Link a bank first.")
    r = await _plaid_post(
        "/accounts/get",
        {
            "client_id": PLAID_CLIENT_ID,
            "secret": PLAID_SECRET,
            "access_token": access_token,
        },
    )
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)
    return {"accounts": r.json().get("accounts", [])}


@router.get("/transactions")
async def get_transactions(
    userId: Optional[str] = None,
    days: int = 30,
    count: int = 50,
    offset: int = 0,
):
    """Return recent transactions (default last 30 days)."""
    _require_creds()
    access_token = ACCESS_TOKENS.get(_key(userId))
    if not access_token:
        raise HTTPException(status_code=400, detail="No access_token yet. Link a bank first.")

    end = date.today()
    start = end - timedelta(days=max(1, min(days, 730)))  # cap at 2 years

    r = await _plaid_post(
        "/transactions/get",
        {
            "client_id": PLAID_CLIENT_ID,
            "secret": PLAID_SECRET,
            "access_token": access_token,
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "options": {"count": count, "offset": offset},
        },
    )
    if r.status_code != 200:
        raise HTTPException(status_code=r.status_code, detail=r.text)

    j = r.json()
    return {
        "total": j.get("total_transactions", 0),
        "transactions": j.get("transactions", []),
        "accounts": j.get("accounts", []),
    }
