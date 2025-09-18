from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Load env vars locally; on Render you set them in the dashboard
load_dotenv()

# Routers
from .routers import plaid

# ---- App ----
app = FastAPI(title="Approve Guard Backend", version="1.0.0")

# ---- CORS ----
# Allow:
#   - all Vercel preview & prod URLs (*.vercel.app)
#   - local dev (localhost:3000 / 5173)
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"^https://.*\.vercel\.app$",
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],   # must include OPTIONS for preflight
    allow_headers=["*"],
)

# ---- Routers ----
app.include_router(plaid.router, prefix="/v1/plaid")

# ---- Healthcheck ----
@app.get("/")
def health():
    return {"ok": True}
