from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()  # loads PLAID_* from env when running locally; on Render you’ll set env vars

from .routers import plaid

app = FastAPI(title="Approve Guard Backend", version="1.0.0")

ALLOWED_ORIGINS = [
    "https://YOUR-FRONTEND.vercel.app",  # ⬅️ replace with your actual Vercel URL
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS + ["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plaid.router, prefix="/v1/plaid")

@app.get("/")
def health():
    return {"ok": True}
