import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from backend.modules.auth import router as auth_router
from backend.modules.categories import router as categories_router
from backend.modules.dashboard import router as dashboard_router
from backend.modules.transactions import router as transactions_router
from backend.modules.utils.router import router as utils_router

app = FastAPI(
    title="FinCoach API",
    version="1.0.0",
    description="API RESTful para autenticao, dashboard e transacoes.",
)

_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]
_frontend_url = os.getenv("FRONTEND_URL", "")
if _frontend_url:
    _origins.append(_frontend_url)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(dashboard_router)
app.include_router(transactions_router)
app.include_router(categories_router)
app.include_router(utils_router)


@app.get("/health", tags=["health"])
def health() -> dict:
    return {"status": "ok"}
