from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

from .routers import plaid

app = FastAPI(title="Approve Guard Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    # allow all Vercel preview/prod URLs + local dev
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plaid.router, prefix="/v1/plaid")

@app.get("/")
def health():
    return {"ok": True}
