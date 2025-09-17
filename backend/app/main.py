# backend/app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load secrets from backend/.env (PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV)
load_dotenv()

from .routers import plaid

app = FastAPI(title="Approve Guard Backend", version="1.0.0")

# 🔐 CORS — add your live Vercel URL below
ALLOWED_ORIGINS = [
    "https://YOUR-FRONTEND.vercel.app",  # ⬅️ replace with your actual Vercel domain
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(plaid.router, prefix="/v1/plaid")

# Health check
@app.get("/")
def health():
    return {"ok": True}

# (Optional) simple ping for debugging CORS quickly
@app.get("/ping")
def ping():
    return {"pong": True}
