from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routers import plaid

app = FastAPI(title="Approve Guard Backend")

# In dev, allow Vite on 5173
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(plaid.router, prefix="/v1/plaid")

@app.get("/")
def health():
    return {"ok": True}
